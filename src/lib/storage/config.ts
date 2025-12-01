import path from 'path';

/**
 * Résout le chemin de stockage en chemin absolu
 * Gère les chemins relatifs (./data) et absolus (/data)
 */
function resolveStoragePath(): string {
  const configPath = process.env.STORAGE_PATH || '/data';

  if (path.isAbsolute(configPath)) {
    return configPath;
  }

  // Chemin relatif: résoudre depuis le répertoire courant
  return path.resolve(process.cwd(), configPath);
}

export const storageConfig = {
  basePath: resolveStoragePath(),
  demosPath: 'demos',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '300', 10),
  maxStoragePerUserMb: parseInt(process.env.MAX_STORAGE_PER_USER_MB || '500', 10),
  demoRetentionDays: parseInt(process.env.DEMO_RETENTION_DAYS || '30', 10),
};

export function getDemosPath(): string {
  return path.join(storageConfig.basePath, storageConfig.demosPath);
}

export function getUserDemosPath(userId: string): string {
  return path.join(getDemosPath(), userId);
}

export function getDemoFilePath(userId: string, filename: string): string {
  return path.join(getUserDemosPath(userId), filename);
}
