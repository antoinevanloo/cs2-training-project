import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getUserDemosPath, getDemoFilePath } from './config';

/**
 * Ensure the storage directory exists for a user
 */
export async function ensureUserStorageExists(userId: string): Promise<void> {
  const userPath = getUserDemosPath(userId);
  await fs.mkdir(userPath, { recursive: true });
}

/**
 * Save a demo file to local storage
 */
export async function saveDemoFile(
  userId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<{ filename: string; path: string; checksum: string; sizeMb: number }> {
  await ensureUserStorageExists(userId);

  // Calculate checksum
  const checksum = crypto.createHash('md5').update(buffer).digest('hex');

  // Generate unique filename
  const timestamp = Date.now();
  const ext = path.extname(originalFilename);
  const basename = path.basename(originalFilename, ext);
  const safeBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const filename = `${safeBasename}_${timestamp}${ext}`;

  const filePath = getDemoFilePath(userId, filename);

  // Write file
  await fs.writeFile(filePath, buffer);

  const sizeMb = buffer.length / (1024 * 1024);

  return {
    filename,
    path: filePath,
    checksum,
    sizeMb,
  };
}

/**
 * Delete a demo file from storage
 */
export async function deleteDemoFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get file info
 */
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  sizeMb?: number;
  modifiedAt?: Date;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      sizeMb: stats.size / (1024 * 1024),
      modifiedAt: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Read demo file
 */
export async function readDemoFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get total storage used by a user
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  const userPath = getUserDemosPath(userId);

  try {
    const files = await fs.readdir(userPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(userPath, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return totalSize / (1024 * 1024); // Return in MB
  } catch {
    return 0;
  }
}

/**
 * List all demo files for a user
 */
export async function listUserDemoFiles(userId: string): Promise<string[]> {
  const userPath = getUserDemosPath(userId);

  try {
    const files = await fs.readdir(userPath);
    return files.filter((f) => f.endsWith('.dem'));
  } catch {
    return [];
  }
}
