/**
 * Parser V2 Strategy - Parser principal avec support complet
 *
 * Utilise parser_v2.py pour extraire toutes les données nécessaires
 * aux analyses v2 (movement, awareness, teamplay).
 *
 * Priorité: 100 (prioritaire sur v1)
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

const PARSER_SCRIPT = path.join(process.cwd(), 'scripts/demo-parser/parser_v2.py');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export class ParserV2Strategy implements IParserStrategy {
  readonly id = 'parser-v2';
  readonly version = '2.0';
  readonly priority = 100;
  readonly description = 'Parser v2 avec support complet (movement, awareness, teamplay)';

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
        reason: `Script parser_v2.py non trouvé: ${PARSER_SCRIPT}`,
      };
    }

    // Vérifier si Python est disponible avec demoparser2
    try {
      const result = await this.checkPythonDependencies();
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
        // Provide diagnostic info
        const hexHeader = buffer.slice(0, 4).toString('hex');
        return {
          valid: false,
          error: `Header de fichier .dem invalide (got: ${header.replace(/[\x00-\x1F\x7F-\xFF]/g, '?')} / 0x${hexHeader}). Ce fichier n'est pas une démo CS2/CS:GO valide.`
        };
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
    const outputPath = `${demoPath}.v2.json`;

    try {
      // Vérifier disponibilité
      const availability = await this.checkAvailability();
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || 'Parser v2 non disponible',
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

      // Préparer les arguments
      const args = this.buildParserArgs(demoPath, outputPath, options);

      // Exécuter le parser
      const result = await this.executePython(args, options?.timeout || DEFAULT_TIMEOUT_MS);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          parserVersion: this.version,
          parseTimeMs: Date.now() - startTime,
        };
      }

      // Lire et parser le résultat JSON
      const jsonContent = await fs.readFile(outputPath, 'utf-8');
      const data: ParsedDemoDataV2 = JSON.parse(jsonContent);

      // Nettoyer le fichier temporaire
      await fs.unlink(outputPath).catch(() => {});

      return {
        success: true,
        data,
        parserVersion: this.version,
        parseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Nettoyer en cas d'erreur
      await fs.unlink(outputPath).catch(() => {});

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de parsing inconnue',
        parserVersion: this.version,
        parseTimeMs: Date.now() - startTime,
      };
    }
  }

  private buildParserArgs(
    demoPath: string,
    outputPath: string,
    options?: ParseOptions
  ): string[] {
    const args = [PARSER_SCRIPT, demoPath, outputPath];

    if (options?.extractWeaponFires === false) {
      args.push('--no-weapon-fires');
    }
    if (options?.extractPositions === false) {
      args.push('--no-positions');
    }
    if (options?.positionSampleRate && options.positionSampleRate !== 64) {
      args.push('--position-sample-rate', options.positionSampleRate.toString());
    }

    return args;
  }

  private async checkPythonDependencies(): Promise<{ available: boolean; reason?: string }> {
    return new Promise((resolve) => {
      const checkProcess = spawn(PYTHON_PATH, [
        '-c',
        'import demoparser2; print("OK")',
      ]);

      let stdout = '';
      let stderr = '';

      checkProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      checkProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      checkProcess.on('close', (code) => {
        if (code === 0 && stdout.includes('OK')) {
          resolve({ available: true });
        } else {
          resolve({
            available: false,
            reason: `demoparser2 non installé: ${stderr || 'pip install demoparser2'}`,
          });
        }
      });

      checkProcess.on('error', (err) => {
        resolve({
          available: false,
          reason: `Python non accessible: ${err.message}`,
        });
      });

      // Timeout court pour la vérification
      setTimeout(() => {
        checkProcess.kill();
        resolve({
          available: false,
          reason: 'Timeout lors de la vérification Python',
        });
      }, 5000);
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

      let stderr = '';

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          // Essayer de parser l'erreur JSON
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

      // Timeout
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

// Singleton pour éviter les vérifications multiples
export const parserV2Strategy = new ParserV2Strategy();