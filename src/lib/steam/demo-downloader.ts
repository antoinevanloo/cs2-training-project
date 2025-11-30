/**
 * Steam Demo Downloader
 *
 * Télécharge les fichiers .dem depuis les serveurs Steam
 * et les décompresse (format bz2).
 */

import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const DOWNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 secondes

export interface DownloadResult {
  success: boolean;
  localPath?: string;
  fileSizeMb?: number;
  error?: string;
}

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number | null;
  percentage: number | null;
}

/**
 * Télécharge une démo depuis l'URL Steam
 *
 * Les démos sont servies en format .dem.bz2 (compressé)
 */
export async function downloadDemo(
  demoUrl: string,
  outputDir: string,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptDownload(demoUrl, outputDir, filename, onProgress);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Download attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Échec du téléchargement après plusieurs tentatives',
  };
}

async function attemptDownload(
  demoUrl: string,
  outputDir: string,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  // S'assurer que le répertoire existe
  await fs.mkdir(outputDir, { recursive: true });

  const tempPath = path.join(outputDir, `${filename}.bz2.tmp`);
  const compressedPath = path.join(outputDir, `${filename}.bz2`);
  const finalPath = path.join(outputDir, filename);

  try {
    // Télécharger le fichier compressé
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

    const response = await fetch(demoUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CS2Coach/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Démo non trouvée (expirée ou supprimée)',
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

    // Créer le stream d'écriture
    const writeStream = createWriteStream(tempPath);
    let bytesDownloaded = 0;

    // Lire et écrire le contenu
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire la réponse');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        writeStream.write(value);
        bytesDownloaded += value.length;

        if (onProgress) {
          onProgress({
            bytesDownloaded,
            totalBytes,
            percentage: totalBytes ? Math.round((bytesDownloaded / totalBytes) * 100) : null,
          });
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Fermer le stream
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Renommer le fichier temporaire
    await fs.rename(tempPath, compressedPath);

    // Décompresser le fichier bz2
    await decompressBz2(compressedPath, finalPath);

    // Supprimer le fichier compressé
    await fs.unlink(compressedPath).catch(() => {
      // Ignorer si le fichier n'existe plus
    });

    // Obtenir la taille finale
    const stats = await fs.stat(finalPath);
    const fileSizeMb = stats.size / (1024 * 1024);

    return {
      success: true,
      localPath: finalPath,
      fileSizeMb,
    };
  } catch (error) {
    // Nettoyer les fichiers temporaires en cas d'erreur
    await fs.unlink(tempPath).catch(() => {});
    await fs.unlink(compressedPath).catch(() => {});
    await fs.unlink(finalPath).catch(() => {});

    throw error;
  }
}

/**
 * Décompresse un fichier .bz2
 *
 * Utilise bunzip2 CLI (disponible par défaut sur macOS/Linux)
 * ou bzip2 -d comme alternative.
 */
async function decompressBz2(inputPath: string, outputPath: string): Promise<void> {
  // Essayer plusieurs commandes de décompression
  const commands = [
    `bunzip2 -c "${inputPath}" > "${outputPath}"`,
    `bzip2 -dc "${inputPath}" > "${outputPath}"`,
    `python3 -c "import bz2; open('${outputPath}', 'wb').write(bz2.decompress(open('${inputPath}', 'rb').read()))"`,
  ];

  for (const cmd of commands) {
    try {
      await execAsync(cmd, { maxBuffer: 500 * 1024 * 1024 }); // 500MB buffer

      // Vérifier que le fichier a été créé
      const stats = await fs.stat(outputPath);
      if (stats.size > 0) {
        return;
      }
    } catch {
      // Essayer la commande suivante
      continue;
    }
  }

  throw new Error(
    'Impossible de décompresser le fichier bz2. ' +
    'Assurez-vous que bunzip2, bzip2 ou python3 est installé.'
  );
}

/**
 * Calcule le checksum MD5 d'un fichier
 */
export async function calculateChecksum(filePath: string): Promise<string> {
  const crypto = await import('crypto');
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

/**
 * Vérifie si une démo a déjà été téléchargée (par checksum ou matchId)
 */
export async function isDemoAlreadyDownloaded(
  matchId: string,
  outputDir: string
): Promise<{ exists: boolean; path?: string }> {
  try {
    const files = await fs.readdir(outputDir);

    for (const file of files) {
      if (file.includes(matchId) && file.endsWith('.dem')) {
        const fullPath = path.join(outputDir, file);
        const stats = await fs.stat(fullPath);

        if (stats.size > 1024) {
          // > 1KB = probablement valide
          return { exists: true, path: fullPath };
        }
      }
    }

    return { exists: false };
  } catch {
    return { exists: false };
  }
}