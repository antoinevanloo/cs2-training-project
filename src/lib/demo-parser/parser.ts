import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { DemoParseResult, ParsedDemoData } from './types';

const PARSER_SCRIPT = path.join(process.cwd(), 'scripts/demo-parser/parser.py');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';

export async function parseDemoFile(demoPath: string): Promise<ParsedDemoData> {
  // Créer un fichier temporaire pour la sortie
  const outputPath = `${demoPath}.json`;

  try {
    // Vérifier que le fichier existe
    await fs.access(demoPath);

    // Exécuter le parser Python
    const result = await executePythonParser(demoPath, outputPath);

    if (!result.success) {
      throw new Error(result.error || 'Erreur de parsing inconnue');
    }

    // Lire le résultat
    const jsonContent = await fs.readFile(outputPath, 'utf-8');
    const parsedData: ParsedDemoData = JSON.parse(jsonContent);

    // Nettoyer le fichier temporaire
    await fs.unlink(outputPath).catch(() => {});

    return parsedData;
  } catch (error) {
    // Nettoyer en cas d'erreur
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

function executePythonParser(
  demoPath: string,
  outputPath: string
): Promise<DemoParseResult> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, [PARSER_SCRIPT, demoPath, outputPath]);

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
          resolve({ success: true, output: outputPath });
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

    // Timeout de 5 minutes pour les grosses démos
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Timeout: parsing trop long'));
    }, 5 * 60 * 1000);
  });
}

export interface DemoValidationResult {
  valid: boolean;
  error?: string;
  header?: string;
  fileSize?: number;
}

export async function validateDemoFile(filePath: string): Promise<DemoValidationResult> {
  try {
    // Vérifier que le fichier existe
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

    // Vérifier la taille minimale (un fichier .dem valide fait au moins quelques KB)
    if (fileSize < 1024) {
      return {
        valid: false,
        error: `Fichier trop petit (${fileSize} bytes). Le fichier est peut-être corrompu ou incomplet.`,
        fileSize,
      };
    }

    const buffer = await fs.readFile(filePath);

    // Vérifier le magic number des fichiers .dem CS2
    // Les fichiers .dem commencent par "PBDEMS2" ou "HL2DEMO"
    const header = buffer.slice(0, 8).toString('utf-8');

    if (header.startsWith('PBDEMS2')) {
      return { valid: true, header: 'PBDEMS2 (CS2)', fileSize };
    }

    if (header.startsWith('HL2DEMO')) {
      return { valid: true, header: 'HL2DEMO (CS:GO)', fileSize };
    }

    // Afficher les premiers bytes pour le debug
    const hexHeader = buffer.slice(0, 16).toString('hex');
    return {
      valid: false,
      error: `Format de fichier non reconnu. En-tête attendu: PBDEMS2 ou HL2DEMO, reçu: "${header.substring(0, 8)}" (hex: ${hexHeader})`,
      header: header.substring(0, 8),
      fileSize,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Erreur lors de la lecture du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
    };
  }
}
