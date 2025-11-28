import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (boss) {
    return boss;
  }

  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 60 * 60, // 1 hour
    archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
    deleteAfterSeconds: 60 * 60 * 24 * 7, // 7 days
  });

  boss.on('error', (error) => {
    console.error('pg-boss error:', error);
  });

  await boss.start();

  return boss;
}

export async function stopJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}

// Job types
export const JOB_TYPES = {
  PROCESS_DEMO: 'process-demo',
  RUN_ANALYSIS: 'run-analysis',
  GENERATE_COACHING: 'generate-coaching',
  CLEANUP_FILES: 'cleanup-files',
  UPDATE_USER_STATS: 'update-user-stats',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// Payload interfaces
export interface ProcessDemoPayload {
  demoId: string;
  userId: string;
  filePath: string;
}

export interface RunAnalysisPayload {
  demoId: string;
  playerSteamId: string;
}

export interface GenerateCoachingPayload {
  analysisId: string;
  userId: string;
}

export interface CleanupFilesPayload {
  olderThanDays: number;
}

export interface UpdateUserStatsPayload {
  userId: string;
}
