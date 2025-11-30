/**
 * Demo Parser v2.0 - Interface TypeScript vers Python
 *
 * Cette version utilise parser_v2.py pour extraire toutes les données
 * nécessaires aux nouveaux analyzers v2:
 * - weapon_fires (counter-strafing, accuracy)
 * - player_blinds (durée flash réelle)
 * - bomb_events (awareness)
 * - economy_by_round (données économiques réelles)
 * - trades, clutches, entry_duels (pré-calculés)
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ParsedDemoDataV2 } from './types-v2';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PARSER_SCRIPT_V2 = path.join(process.cwd(), 'scripts/demo-parser/parser_v2.py');
const PARSER_SCRIPT_V1 = path.join(process.cwd(), 'scripts/demo-parser/parser.py');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';

// Timeout de 10 minutes pour les grosses démos avec extraction complète
const PARSE_TIMEOUT_MS = 10 * 60 * 1000;

export interface ParserConfig {
  // Utiliser le parser v2 (default: true)
  useV2Parser: boolean;

  // Extraire les weapon_fires (lourd, mais nécessaire pour movement analysis)
  extractWeaponFires: boolean;

  // Extraire les positions continues (lourd)
  extractPositions: boolean;

  // Taux d'échantillonnage des positions (1 = chaque tick, 64 = chaque demi-seconde)
  positionSampleRate: number;
}

const DEFAULT_CONFIG: ParserConfig = {
  useV2Parser: true,
  extractWeaponFires: true,
  extractPositions: true,
  positionSampleRate: 64,
};

export interface DemoParseResult {
  success: boolean;
  error?: string;
  output?: string;
}

// =============================================================================
// PARSER PRINCIPAL
// =============================================================================

/**
 * Parse une démo avec le parser v2
 */
export async function parseDemoFileV2(
  demoPath: string,
  config: Partial<ParserConfig> = {}
): Promise<ParsedDemoDataV2> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Créer un fichier temporaire pour la sortie
  const outputPath = `${demoPath}.v2.json`;

  try {
    // Vérifier que le fichier existe
    await fs.access(demoPath);

    // Vérifier que le parser v2 existe
    const parserScript = finalConfig.useV2Parser ? PARSER_SCRIPT_V2 : PARSER_SCRIPT_V1;
    try {
      await fs.access(parserScript);
    } catch {
      console.warn(`Parser v2 not found at ${parserScript}, falling back to v1`);
      // Fallback au parser v1 si v2 n'existe pas
      return await parseDemoFileV1Compat(demoPath);
    }

    // Préparer les arguments
    const args = [
      parserScript,
      demoPath,
      outputPath,
    ];

    // Ajouter les options de configuration
    if (!finalConfig.extractWeaponFires) {
      args.push('--no-weapon-fires');
    }
    if (!finalConfig.extractPositions) {
      args.push('--no-positions');
    }
    if (finalConfig.positionSampleRate !== 64) {
      args.push('--sample-rate', finalConfig.positionSampleRate.toString());
    }

    // Exécuter le parser Python
    const result = await executePythonParser(args, PARSE_TIMEOUT_MS);

    if (!result.success) {
      throw new Error(result.error || 'Erreur de parsing inconnue');
    }

    // Lire le résultat
    const jsonContent = await fs.readFile(outputPath, 'utf-8');
    const parsedData: ParsedDemoDataV2 = JSON.parse(jsonContent);

    // Valider les données
    validateParsedData(parsedData);

    // Nettoyer le fichier temporaire
    await fs.unlink(outputPath).catch(() => {});

    return parsedData;
  } catch (error) {
    // Nettoyer en cas d'erreur
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

/**
 * Compatibilité avec le parser v1 (retourne des données au format v2)
 */
async function parseDemoFileV1Compat(demoPath: string): Promise<ParsedDemoDataV2> {
  const outputPath = `${demoPath}.json`;

  try {
    const result = await executePythonParser(
      [PARSER_SCRIPT_V1, demoPath, outputPath],
      5 * 60 * 1000 // 5 minutes pour v1
    );

    if (!result.success) {
      throw new Error(result.error || 'Erreur de parsing v1');
    }

    const jsonContent = await fs.readFile(outputPath, 'utf-8');
    const v1Data = JSON.parse(jsonContent);

    await fs.unlink(outputPath).catch(() => {});

    // Convertir v1 vers v2 avec des valeurs par défaut
    return convertV1ToV2(v1Data);
  } catch (error) {
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

/**
 * Convertit les données v1 vers le format v2
 */
function convertV1ToV2(v1Data: any): ParsedDemoDataV2 {
  return {
    version: '1.0-compat',
    metadata: {
      map: v1Data.metadata?.map || 'unknown',
      duration: v1Data.metadata?.duration || 0,
      tickrate: v1Data.metadata?.tickrate || 64,
      matchDate: v1Data.metadata?.matchDate || null,
    },
    players: v1Data.players || [],
    rounds: v1Data.rounds || [],
    kills: (v1Data.kills || []).map((k: any) => ({
      ...k,
      weaponCategory: 'other' as const,
      distance: 0,
    })),
    damages: (v1Data.damages || []).map((d: any) => ({
      ...d,
      weaponCategory: 'other' as const,
      damageArmor: 0,
      healthRemaining: 100,
      armorRemaining: 0,
    })),
    grenades: v1Data.grenades || [],
    playerBlinds: [], // Non disponible en v1
    bombEvents: [], // Non disponible en v1
    economyByRound: [], // Non disponible en v1
    purchases: [], // Non disponible en v1
    weaponFires: [], // Non disponible en v1
    positions: [], // Non disponible en v1
    clutches: [], // Sera calculé par le teamplay analyzer
    entryDuels: [], // Sera calculé par le teamplay analyzer
    trades: [], // Sera calculé par le teamplay analyzer
    parsingStats: {
      totalKills: v1Data.kills?.length || 0,
      totalDamages: v1Data.damages?.length || 0,
      totalGrenades: v1Data.grenades?.length || 0,
      totalBlinds: 0,
      totalBombEvents: 0,
      totalWeaponFires: 0,
      totalPositionSnapshots: 0,
      totalPurchases: 0,
    },
  };
}

/**
 * Exécute le parser Python
 */
function executePythonParser(
  args: string[],
  timeoutMs: number
): Promise<DemoParseResult> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, args);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          resolve({ success: true, output: args[2] });
        }
      } else {
        try {
          const error = JSON.parse(stderr);
          resolve({ success: false, error: error.error });
        } catch {
          resolve({ success: false, error: stderr || `Exit code: ${code}` });
        }
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error(`Timeout: parsing trop long (>${timeoutMs / 1000}s)`));
    }, timeoutMs);

    pythonProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Valide les données parsées
 */
function validateParsedData(data: ParsedDemoDataV2): void {
  if (!data.metadata) {
    throw new Error('Données invalides: metadata manquante');
  }

  if (!data.kills || !Array.isArray(data.kills)) {
    throw new Error('Données invalides: kills manquants');
  }

  if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
    throw new Error('Données invalides: players manquants');
  }

  if (!data.rounds || !Array.isArray(data.rounds)) {
    throw new Error('Données invalides: rounds manquants');
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si le parser v2 est disponible
 */
export async function isParserV2Available(): Promise<boolean> {
  try {
    await fs.access(PARSER_SCRIPT_V2);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtient les informations sur le parser
 */
export async function getParserInfo(): Promise<{
  v1Available: boolean;
  v2Available: boolean;
  pythonPath: string;
}> {
  const v1Available = await fs.access(PARSER_SCRIPT_V1).then(() => true).catch(() => false);
  const v2Available = await fs.access(PARSER_SCRIPT_V2).then(() => true).catch(() => false);

  return {
    v1Available,
    v2Available,
    pythonPath: PYTHON_PATH,
  };
}

// =============================================================================
// VALIDATION DE FICHIER (réutilisée de parser.ts)
// =============================================================================

export interface DemoValidationResult {
  valid: boolean;
  error?: string;
  header?: string;
  fileSize?: number;
}

export async function validateDemoFile(filePath: string): Promise<DemoValidationResult> {
  try {
    try {
      await fs.access(filePath);
    } catch {
      return {
        valid: false,
        error: `Fichier introuvable: ${filePath}`,
      };
    }

    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    if (fileSize < 1024) {
      return {
        valid: false,
        error: `Fichier trop petit (${fileSize} bytes).`,
        fileSize,
      };
    }

    const buffer = await fs.readFile(filePath);
    const header = buffer.slice(0, 8).toString('utf-8');

    if (header.startsWith('PBDEMS2')) {
      return { valid: true, header: 'PBDEMS2 (CS2)', fileSize };
    }

    if (header.startsWith('HL2DEMO')) {
      return { valid: true, header: 'HL2DEMO (CS:GO)', fileSize };
    }

    const hexHeader = buffer.slice(0, 16).toString('hex');
    return {
      valid: false,
      error: `Format non reconnu. Header: "${header.substring(0, 8)}" (hex: ${hexHeader})`,
      header: header.substring(0, 8),
      fileSize,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Erreur lecture: ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
    };
  }
}
