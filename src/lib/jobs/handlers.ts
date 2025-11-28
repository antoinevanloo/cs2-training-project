import PgBoss from 'pg-boss';
import { JOB_TYPES, UpdateUserStatsPayload, CleanupFilesPayload } from './queue';
import { updateUserStats } from '@/lib/db/queries/stats';
import { cleanupArchivedDemos, archiveOldDemos } from '@/lib/storage/cleanup';
import { registerDemoProcessorWorker } from './workers/demo-processor';

export async function registerAllWorkers(boss: PgBoss): Promise<void> {
  // Register demo processor
  registerDemoProcessorWorker(boss);

  // Register user stats updater
  boss.work<UpdateUserStatsPayload>(
    JOB_TYPES.UPDATE_USER_STATS,
    async (job) => {
      const { userId } = job.data;
      console.log(`[Job ${job.id}] Updating stats for user ${userId}`);

      try {
        await updateUserStats(userId);
        console.log(`[Job ${job.id}] Stats updated for user ${userId}`);
      } catch (error) {
        console.error(`[Job ${job.id}] Error updating stats:`, error);
        throw error;
      }
    }
  );

  // Register cleanup worker
  boss.work<CleanupFilesPayload>(
    JOB_TYPES.CLEANUP_FILES,
    async (job) => {
      const { olderThanDays } = job.data;
      console.log(`[Job ${job.id}] Running cleanup for files older than ${olderThanDays} days`);

      try {
        // Archive old demos
        const archived = await archiveOldDemos(7);
        console.log(`[Job ${job.id}] Archived ${archived} demos`);

        // Clean up archived files
        const { deletedCount, freedSpaceMb } = await cleanupArchivedDemos(olderThanDays);
        console.log(
          `[Job ${job.id}] Deleted ${deletedCount} files, freed ${freedSpaceMb.toFixed(2)} MB`
        );
      } catch (error) {
        console.error(`[Job ${job.id}] Error during cleanup:`, error);
        throw error;
      }
    }
  );

  console.log('All workers registered');
}

export async function scheduleRecurringJobs(boss: PgBoss): Promise<void> {
  // Schedule daily cleanup
  await boss.schedule(JOB_TYPES.CLEANUP_FILES, '0 3 * * *', {
    olderThanDays: 30,
  });

  console.log('Recurring jobs scheduled');
}
