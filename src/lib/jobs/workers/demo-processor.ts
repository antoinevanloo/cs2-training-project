import PgBoss from 'pg-boss';
import prisma from '@/lib/db/prisma';
import { parseDemoFile, validateDemoFile } from '@/lib/demo-parser/parser';
import {
  extractPlayerStats,
  getPlayerTeam,
  determineMatchResult,
  calculateEntryStats,
} from '@/lib/demo-parser/extractor';
import { analysisEngine } from '@/lib/analysis/engine';
import { coachingEngine } from '@/lib/coaching/engine';
import { calculateSimpleRating } from '@/lib/analysis/calculators/rating';
import { JOB_TYPES, ProcessDemoPayload } from '../queue';

export function registerDemoProcessorWorker(boss: PgBoss): void {
  boss.work<ProcessDemoPayload>(
    JOB_TYPES.PROCESS_DEMO,
    { teamConcurrency: parseInt(process.env.JOB_CONCURRENCY || '2', 10) },
    async (job) => {
      const { demoId, userId, filePath: rawFilePath } = job.data;

      const filePath = rawFilePath.startsWith('/') ? rawFilePath : `/${rawFilePath}`;

      console.log(`[Job ${job.id}] Processing demo ${demoId}`);
      console.log(`[Job ${job.id}] File path: ${filePath}`);

      try {
        const existingDemo = await prisma.demo.findUnique({
          where: { id: demoId },
          select: { id: true, status: true },
        });

        if (!existingDemo) {
          console.log(`[Job ${job.id}] Demo ${demoId} not found in database, skipping`);
          return;
        }

        if (existingDemo.status === 'COMPLETED') {
          console.log(`[Job ${job.id}] Demo ${demoId} already completed, skipping`);
          return;
        }

        await prisma.demo.update({
          where: { id: demoId },
          data: { status: 'PROCESSING', processingStartedAt: new Date() },
        });

        const validation = await validateDemoFile(filePath);
        if (!validation.valid) {
          throw new Error(validation.error || 'Fichier .dem invalide ou corrompu');
        }
        console.log(`[Job ${job.id}] File validation passed: ${validation.header}`);

        const parsedData = await parseDemoFile(filePath);

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { steamId: true },
        });

        let mainPlayerSteamId = user?.steamId;
        if (!mainPlayerSteamId && parsedData.players.length > 0) {
          mainPlayerSteamId = parsedData.players[0].steamId;
        }

        if (!mainPlayerSteamId) {
          throw new Error(
            'Impossible d\'identifier le joueur principal. ' +
            'Vérifiez que votre Steam ID est correctement configuré dans les paramètres.'
          );
        }

        const playerTeam = getPlayerTeam(parsedData, mainPlayerSteamId);
        const matchResult = determineMatchResult(parsedData, playerTeam);
        const totalRounds = parsedData.rounds.length;

        // Run analysis & coaching (CPU intensive tasks) before the transaction
        const analysisResult = await analysisEngine.analyzeDemo(parsedData, mainPlayerSteamId);
        const coachingReport = coachingEngine.generateReport(analysisResult);

        // All database writes are now in a single transaction
        await prisma.$transaction(async (tx) => {
          const updateData: Record<string, unknown> = {
            status: 'ANALYZING',
            mapName: parsedData.metadata.map,
            duration: Math.round(parsedData.metadata.duration),
            scoreTeam1: matchResult.scoreTeam1,
            scoreTeam2: matchResult.scoreTeam2,
            playerTeam,
            matchResult: matchResult.result,
            metadata: parsedData.metadata,
          };

          if (parsedData.metadata.matchDate) {
            try {
              const extractedDate = new Date(parsedData.metadata.matchDate);
              if (!isNaN(extractedDate.getTime())) {
                updateData.matchDate = extractedDate;
              }
            } catch {}
          }

          await tx.demo.update({ where: { id: demoId }, data: updateData });

          for (const player of parsedData.players) {
            const stats = extractPlayerStats(parsedData, player.steamId);
            const entryStats = calculateEntryStats(parsedData, player.steamId);
            const isMainPlayer = player.steamId === mainPlayerSteamId;
            const playerRating = calculateSimpleRating(stats.kills, stats.deaths, stats.assists, totalRounds);

            await tx.demoPlayerStats.create({
              data: {
                demoId,
                steamId: player.steamId,
                playerName: player.name,
                isMainPlayer,
                team: player.team,
                kills: stats.kills,
                deaths: stats.deaths,
                assists: stats.assists,
                headshots: stats.headshots,
                headshotPercentage: stats.kills > 0 ? (stats.headshots / stats.kills) * 100 : 0,
                adr: totalRounds > 0 ? stats.totalDamage / totalRounds : 0,
                kast: 0,
                rating: playerRating,
                weaponStats: stats.weaponStats,
                entryKills: entryStats.entryKills,
                entryDeaths: entryStats.entryDeaths,
              },
            });
          }

          for (const round of parsedData.rounds) {
            const roundKills = parsedData.kills.filter((k) => k.round === round.roundNumber);
            await tx.round.create({
              data: {
                demoId,
                roundNumber: round.roundNumber,
                winnerTeam: round.winner,
                winReason: getWinReasonString(round.reason),
                team1Money: 0,
                team2Money: 0,
                team1Equipment: 0,
                team2Equipment: 0,
                events: roundKills as any,
                duration: 0,
              },
            });
          }

          await tx.analysis.create({
            data: {
              demoId,
              overallScore: analysisResult.scores.overall,
              aimScore: analysisResult.scores.aim,
              positioningScore: analysisResult.scores.positioning,
              utilityScore: analysisResult.scores.utility,
              economyScore: analysisResult.scores.economy,
              timingScore: analysisResult.scores.timing,
              decisionScore: analysisResult.scores.decision,
              aimAnalysis: analysisResult.analyses.aim as any,
              positioningAnalysis: analysisResult.analyses.positioning as any,
              utilityAnalysis: analysisResult.analyses.utility as any,
              economyAnalysis: analysisResult.analyses.economy as any,
              timingAnalysis: analysisResult.analyses.timing as any,
              decisionAnalysis: analysisResult.analyses.decision as any,
              strengths: analysisResult.strengths,
              weaknesses: analysisResult.weaknesses,
              coachingReport: coachingReport as any,
            },
          });

          await tx.demoPlayerStats.updateMany({
            where: { demoId, isMainPlayer: true },
            data: {
              rating: analysisResult.playerStats.rating,
              kast: analysisResult.playerStats.kast,
              assists: analysisResult.playerStats.assists,
            },
          });

          await tx.demo.update({
            where: { id: demoId },
            data: { status: 'COMPLETED', processingCompletedAt: new Date() },
          });
        });

        await boss.send(JOB_TYPES.UPDATE_USER_STATS, { userId });

        console.log(`[Job ${job.id}] Demo ${demoId} processed successfully`);
      } catch (error) {
        console.error(`[Job ${job.id}] Error processing demo:`, error);

        try {
          await prisma.demo.update({
            where: { id: demoId },
            data: {
              status: 'FAILED',
              statusMessage: error instanceof Error ? error.message : 'Erreur inconnue',
            },
          });
        } catch (updateError) {
          console.log(`[Job ${job.id}] Could not update demo status (demo may have been deleted)`);
        }

        throw error;
      }
    }
  );
}

function getWinReasonString(reason: number): string {
  const reasons: Record<number, string> = {
    1: 'target_bombed',
    7: 'bomb_defused',
    8: 'ct_elimination',
    9: 't_elimination',
    12: 'time_expired',
  };
  return reasons[reason] || 'unknown';
}
