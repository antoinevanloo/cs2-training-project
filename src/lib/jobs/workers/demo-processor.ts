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
import { JOB_TYPES, ProcessDemoPayload } from '../queue';

export function registerDemoProcessorWorker(boss: PgBoss): void {
  boss.work<ProcessDemoPayload>(
    JOB_TYPES.PROCESS_DEMO,
    { teamConcurrency: parseInt(process.env.JOB_CONCURRENCY || '2', 10) },
    async (job) => {
      const { demoId, userId, filePath } = job.data;

      console.log(`[Job ${job.id}] Processing demo ${demoId}`);

      try {
        // Update status
        await prisma.demo.update({
          where: { id: demoId },
          data: {
            status: 'PROCESSING',
            processingStartedAt: new Date(),
          },
        });

        // Validate file
        const isValid = await validateDemoFile(filePath);
        if (!isValid) {
          throw new Error('Invalid or corrupted .dem file');
        }

        // Parse file
        const parsedData = await parseDemoFile(filePath);

        // Get user's Steam ID
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { steamId: true },
        });

        // Find main player
        let mainPlayerSteamId = user?.steamId;
        if (!mainPlayerSteamId && parsedData.players.length > 0) {
          mainPlayerSteamId = parsedData.players[0].steamId;
        }

        if (!mainPlayerSteamId) {
          throw new Error('Cannot identify main player');
        }

        // Calculate match result
        const playerTeam = getPlayerTeam(parsedData, mainPlayerSteamId);
        const matchResult = determineMatchResult(parsedData, playerTeam);

        // Update demo metadata
        await prisma.demo.update({
          where: { id: demoId },
          data: {
            status: 'ANALYZING',
            mapName: parsedData.metadata.map,
            duration: Math.round(parsedData.metadata.duration),
            scoreTeam1: matchResult.scoreTeam1,
            scoreTeam2: matchResult.scoreTeam2,
            playerTeam,
            matchResult: matchResult.result,
            metadata: parsedData.metadata as any,
          },
        });

        // Create player stats
        for (const player of parsedData.players) {
          const stats = extractPlayerStats(parsedData, player.steamId);
          const entryStats = calculateEntryStats(parsedData, player.steamId);
          const isMainPlayer = player.steamId === mainPlayerSteamId;

          await prisma.demoPlayerStats.create({
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
              headshotPercentage:
                stats.kills > 0 ? (stats.headshots / stats.kills) * 100 : 0,
              adr:
                parsedData.rounds.length > 0
                  ? stats.totalDamage / parsedData.rounds.length
                  : 0,
              kast: 0, // Calculated in analysis
              rating: 1.0, // Calculated in analysis
              weaponStats: stats.weaponStats,
              entryKills: entryStats.entryKills,
              entryDeaths: entryStats.entryDeaths,
            },
          });
        }

        // Create round data
        for (const round of parsedData.rounds) {
          const roundKills = parsedData.kills.filter(
            (k) => k.round === round.roundNumber
          );

          await prisma.round.create({
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

        // Run analysis
        const analysisResult = await analysisEngine.analyzeDemo(
          parsedData,
          mainPlayerSteamId
        );

        // Generate coaching report
        const coachingReport = coachingEngine.generateReport(analysisResult);

        // Save analysis
        await prisma.analysis.create({
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

        // Update main player stats with calculated values
        await prisma.demoPlayerStats.updateMany({
          where: {
            demoId,
            isMainPlayer: true,
          },
          data: {
            rating: analysisResult.playerStats.rating,
            kast: analysisResult.playerStats.kast,
            assists: analysisResult.playerStats.assists,
          },
        });

        // Update final status
        await prisma.demo.update({
          where: { id: demoId },
          data: {
            status: 'COMPLETED',
            processingCompletedAt: new Date(),
          },
        });

        // Queue user stats update
        await boss.send(JOB_TYPES.UPDATE_USER_STATS, { userId });

        console.log(`[Job ${job.id}] Demo ${demoId} processed successfully`);
      } catch (error) {
        console.error(`[Job ${job.id}] Error processing demo:`, error);

        await prisma.demo.update({
          where: { id: demoId },
          data: {
            status: 'FAILED',
            statusMessage:
              error instanceof Error ? error.message : 'Unknown error',
          },
        });

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
