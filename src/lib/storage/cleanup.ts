import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';
import { getDemosPath } from './config';
import { deleteDemoFile } from './local';

/**
 * Clean up old archived demos
 */
export async function cleanupArchivedDemos(olderThanDays: number = 30): Promise<{
  deletedCount: number;
  freedSpaceMb: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  // Find old archived demos
  const oldDemos = await prisma.demo.findMany({
    where: {
      isArchived: true,
      archivedAt: {
        lt: cutoffDate,
      },
      localPath: {
        not: null,
      },
    },
    select: {
      id: true,
      localPath: true,
      fileSizeMb: true,
      userId: true,
    },
  });

  let deletedCount = 0;
  let freedSpaceMb = 0;

  for (const demo of oldDemos) {
    if (demo.localPath) {
      try {
        await deleteDemoFile(demo.localPath);

        // Update demo record
        await prisma.demo.update({
          where: { id: demo.id },
          data: {
            localPath: null,
          },
        });

        // Update user storage
        await prisma.user.update({
          where: { id: demo.userId },
          data: {
            storageUsedMb: {
              decrement: demo.fileSizeMb,
            },
          },
        });

        deletedCount++;
        freedSpaceMb += demo.fileSizeMb;
      } catch (error) {
        console.error(`Failed to delete demo ${demo.id}:`, error);
      }
    }
  }

  return { deletedCount, freedSpaceMb };
}

/**
 * Clean up orphaned files (files without DB records)
 */
export async function cleanupOrphanedFiles(): Promise<{
  deletedCount: number;
  freedSpaceMb: number;
}> {
  const demosPath = getDemosPath();
  let deletedCount = 0;
  let freedSpaceMb = 0;

  try {
    // Get all user directories
    const userDirs = await fs.readdir(demosPath);

    for (const userId of userDirs) {
      const userPath = path.join(demosPath, userId);
      const stats = await fs.stat(userPath);

      if (!stats.isDirectory()) continue;

      // Get all demo files for this user
      const files = await fs.readdir(userPath);

      for (const file of files) {
        if (!file.endsWith('.dem')) continue;

        const filePath = path.join(userPath, file);

        // Check if there's a DB record for this file
        const demo = await prisma.demo.findFirst({
          where: {
            localPath: filePath,
          },
        });

        if (!demo) {
          // Orphaned file - delete it
          try {
            const fileStats = await fs.stat(filePath);
            await fs.unlink(filePath);
            deletedCount++;
            freedSpaceMb += fileStats.size / (1024 * 1024);
          } catch (error) {
            console.error(`Failed to delete orphaned file ${filePath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during orphaned files cleanup:', error);
  }

  return { deletedCount, freedSpaceMb };
}

/**
 * Archive old completed demos
 */
export async function archiveOldDemos(olderThanDays: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.demo.updateMany({
    where: {
      status: 'COMPLETED',
      isArchived: false,
      matchDate: {
        lt: cutoffDate,
      },
    },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });

  return result.count;
}
