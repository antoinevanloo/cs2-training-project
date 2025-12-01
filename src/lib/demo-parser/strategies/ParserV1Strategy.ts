/**
 * Parser V1 Strategy - Parser de fallback
 *
 * Utilise parser.py (v1) comme fallback quand v2 n'est pas disponible.
 * Fournit les données de base mais PAS les données v2 (movement, awareness, teamplay).
 *
 * Priorité: 50 (fallback après v2)
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  IParserStrategy,
  ParserAvailability,
  ParseOptions,
  ParseResult,
} from './IParserStrategy';
import type { ParsedDemoDataV2 } from '../types-v2';

const PARSER_SCRIPT = path.join(process.cwd(), 'scripts/demo-parser/parser.py');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (v1 est plus rapide)

export class ParserV1Strategy implements IParserStrategy {
  readonly id = 'parser-v1';
  readonly version = '1.0';
  readonly priority = 50;
  readonly description = 'Parser v1 basique (fallback, pas de support v2 analyses)';

  private pythonAvailable: boolean | null = null;
  private scriptExists: boolean | null = null;

  async checkAvailability(): Promise<ParserAvailability> {
    // Vérifier si le script existe
    try {
      await fs.access(PARSER_SCRIPT);
      this.scriptExists = true;
    } catch {
      this.scriptExists = false;
      return {
        available: false,
        version: this.version,
        reason: `Script parser.py non trouvé: ${PARSER_SCRIPT}`,
      };
    }

    // Vérifier si Python est disponible
    try {
      const result = await this.checkPython();
      this.pythonAvailable = result.available;
      if (!result.available) {
        return {
          available: false,
          version: this.version,
          reason: result.reason,
        };
      }
    } catch (error) {
      this.pythonAvailable = false;
      return {
        available: false,
        version: this.version,
        reason: `Erreur vérification Python: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }

    return {
      available: true,
      version: this.version,
    };
  }

  async validateFile(demoPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const stats = await fs.stat(demoPath);

      if (!stats.isFile()) {
        return { valid: false, error: 'Le chemin ne pointe pas vers un fichier' };
      }

      if (!demoPath.toLowerCase().endsWith('.dem')) {
        return { valid: false, error: 'Le fichier doit avoir l\'extension .dem' };
      }

      // Vérifier le header du fichier .dem
      // CS:GO/Source 1 demos: "HL2DEMO"
      // CS2/Source 2 demos: "PBDEMS2" (protobuf demos source 2)
      const fd = await fs.open(demoPath, 'r');
      const buffer = Buffer.alloc(8);
      await fd.read(buffer, 0, 8, 0);
      await fd.close();

      const header = buffer.toString('ascii', 0, 8);
      const isValidHeader = header.startsWith('HL2DEMO') || header.startsWith('PBDEMS2');
      if (!isValidHeader) {
        return { valid: false, error: 'Header de fichier .dem invalide' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur de validation',
      };
    }
  }

  async parse(demoPath: string, options?: ParseOptions): Promise<ParseResult> {
    const startTime = Date.now();
    const outputPath = `${demoPath}.json`;

    try {
      // Vérifier disponibilité
      const availability = await this.checkAvailability();
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || 'Parser v1 non disponible',
          parserVersion: this.version,
          parseTimeMs: Date.now() - startTime,
        };
      }

      // Valider le fichier
      const validation = await this.validateFile(demoPath);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          parserVersion: this.version,
          parseTimeMs: Date.now() - startTime,
        };
      }

      // Exécuter le parser v1
      const result = await this.executePython(
        [PARSER_SCRIPT, demoPath, outputPath],
        options?.timeout || DEFAULT_TIMEOUT_MS
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          parserVersion: this.version,
          parseTimeMs: Date.now() - startTime,
        };
      }

      // Lire et convertir vers format v2
      const jsonContent = await fs.readFile(outputPath, 'utf-8');
      const v1Data = JSON.parse(jsonContent);
      const data = this.convertToV2Format(v1Data);

      // Nettoyer
      await fs.unlink(outputPath).catch(() => {});

      return {
        success: true,
        data,
        parserVersion: this.version,
        parseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      await fs.unlink(outputPath).catch(() => {});

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de parsing inconnue',
        parserVersion: this.version,
        parseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Convertit les données v1 vers le format v2
   * Les champs spécifiques v2 sont laissés vides (seront null/undefined)
   */
  private convertToV2Format(v1Data: any): ParsedDemoDataV2 {
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
      // Données v2 non disponibles avec parser v1
      playerBlinds: [],
      bombEvents: [],
      economyByRound: [],
      purchases: [],
      weaponFires: [],
      positions: [],
      clutches: [],
      entryDuels: [],
      trades: [],
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

  private async checkPython(): Promise<{ available: boolean; reason?: string }> {
    return new Promise((resolve) => {
      const checkProcess = spawn(PYTHON_PATH, ['--version']);

      let stdout = '';

      checkProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      checkProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ available: true });
        } else {
          resolve({
            available: false,
            reason: 'Python non accessible',
          });
        }
      });

      checkProcess.on('error', (err) => {
        resolve({
          available: false,
          reason: `Python non accessible: ${err.message}`,
        });
      });

      setTimeout(() => {
        checkProcess.kill();
        resolve({ available: false, reason: 'Timeout vérification Python' });
      }, 3000);
    });
  }

  private executePython(
    args: string[],
    timeout: number
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(PYTHON_PATH, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

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
          resolve({ success: true });
        } else {
          try {
            const errorObj = JSON.parse(stderr);
            resolve({ success: false, error: errorObj.error || stderr });
          } catch {
            resolve({ success: false, error: stderr || `Exit code: ${code}` });
          }
        }
      });

      pythonProcess.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        resolve({ success: false, error: `Timeout après ${timeout / 1000}s` });
      }, timeout);

      pythonProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }
}

// Singleton
export const parserV1Strategy = new ParserV1Strategy();