import { getJobQueue, stopJobQueue } from '../src/lib/jobs/queue';
import { registerAllWorkers, scheduleRecurringJobs } from '../src/lib/jobs/handlers';

async function main() {
  console.log('Starting worker process...');

  const boss = await getJobQueue();
  console.log('Connected to pg-boss');

  await registerAllWorkers(boss);
  await scheduleRecurringJobs(boss);

  console.log('Worker process started and ready to process jobs');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    await stopJobQueue();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
