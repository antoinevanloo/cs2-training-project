import PgBoss from 'pg-boss';
import prisma from '@/lib/db/prisma';
import {
  extractPlayerStats,
  getPlayerTeam,
  determineMatchResult,
  calculateEntryStats,
} from '@/lib/demo-parser/extractor';
import { parserContext } from '@/lib/demo-parser/strategies';
import { analysisEngineV2, AnalysisResultV2 } from '@/lib/analysis/engine-v2';
import { coachingEngine } from '@/lib/coaching/engine';
import { calculateSimpleRating } from '@/lib/analysis/calculators/rating';
import { JOB_TYPES, ProcessDemoPayload } from '../queue';
import { ParsedDemoDataV2 } from '@/lib/demo-parser/types-v2';

export function registerDemoProcessorWorker(boss: PgBoss): void {
  boss.work<ProcessDemoPayload>(
    JOB_TYPES.PROCESS_DEMO,
    { teamConcurrency: parseInt(process.env.JOB_CONCURRENCY || '2', 10) },
    async (job) => {
      const { demoId, userId, filePath: rawFilePath } = job.data;

      // Convert path for Docker environment
      // Host path: /Users/.../data/demos/... -> Container path: /data/demos/...
      let filePath = rawFilePath.startsWith('/') ? rawFilePath : `/${rawFilePath}`;

      // If running in Docker (STORAGE_PATH=/data) and path contains local dev path
      const storagePath = process.env.STORAGE_PATH || '/data';
      const dataPathMatch = filePath.match(/\/data\/demos\/.+$/);
      if (dataPathMatch && storagePath === '/data') {
        // Extract the relative path from /data/demos/...
        filePath = dataPathMatch[0];
      }

      const shortJobId = job.id.slice(0, 8);
      console.log(`[${shortJobId}] Processing demo ${demoId}`);
      console.log(`[${shortJobId}] File path: ${filePath}`);

      const parseStartTime = Date.now();

      try {
        const existingDemo = await prisma.demo.findUnique({
          where: { id: demoId },
          select: { id: true, status: true },
        });

        if (!existingDemo) {
          console.log(`[${shortJobId}] Skipped: demo not found in database`);
          return;
        }

        if (existingDemo.status === 'COMPLETED') {
          console.log(`[${shortJobId}] Skipped: already completed`);
          return;
        }

        await prisma.demo.update({
          where: { id: demoId },
          data: { status: 'PROCESSING', processingStartedAt: new Date() },
        });

        // Utiliser le ParserContext pour valider et parser
        console.log(`[${shortJobId}] Validating file: ${filePath}`);

        // Retry logic for file access (prevent race condition)
        let validation: { valid: boolean; error?: string } = { valid: false, error: 'No validation attempt' };
        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries) {
          validation = await parserContext.validateFile(filePath, {
            onLog: (msg) => console.log(`[${shortJobId}] ${msg}`),
          });

          if (validation.valid) {
            break;
          }

          // Check if error is "file not found" - if so, retry
          if (validation.error?.includes('ENOENT') || validation.error?.includes('no such file')) {
            retries++;
            if (retries < maxRetries) {
              console.log(`[${shortJobId}] File not found, retrying (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
              continue;
            }
          }

          // Other errors - don't retry
          break;
        }

        if (!validation.valid) {
          const errorMsg = validation.error || 'Fichier .dem invalide ou corrompu';
          console.log(`[${shortJobId}] Validation failed: ${errorMsg}`);

          // Handle missing file as a special case - cleanup orphaned record
          if (errorMsg.includes('ENOENT') || errorMsg.includes('no such file')) {
            console.log(`[${shortJobId}] File permanently missing, cleaning up orphaned demo record...`);
            try {
              await prisma.demo.delete({
                where: { id: demoId }
              });
              console.log(`[${shortJobId}] Orphaned demo record deleted successfully`);
              // Don't throw - treat as handled cleanup
              return;
            } catch (cleanupError) {
              console.error(`[${shortJobId}] Failed to cleanup orphaned record:`, cleanupError);
              // Even if cleanup fails, consider this handled to avoid duplicate errors
              return;
            }
          }

          // For other validation errors, throw to trigger standard error handling
          throw new Error(errorMsg);
        }
        console.log(`[${shortJobId}] File validation passed`);

        // Parser avec sélection automatique du meilleur parser disponible
        const parseResult = await parserContext.parse(
          filePath,
          {
            extractWeaponFires: true,
            extractPositions: true,
            positionSampleRate: 64,
          },
          {
            onLog: (msg) => console.log(`[${shortJobId}] ${msg}`),
          }
        );

        if (!parseResult.success || !parseResult.data) {
          throw new Error(parseResult.error || 'Erreur de parsing inconnue');
        }

        const parsedData: ParsedDemoDataV2 = parseResult.data;
        const isV2Parser = parseResult.parserVersion.startsWith('2');
        const parseTime = (parseResult.parseTimeMs / 1000).toFixed(1);

        // Log parsing summary
        console.log(
          `[${shortJobId}] Parsed ${parsedData.metadata.map} with ${parseResult.parserVersion} in ${parseTime}s ` +
          `(${parsedData.rounds.length} rounds, ${parsedData.kills.length} kills)`
        );

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

        const playerTeam = getPlayerTeam(parsedData as any, mainPlayerSteamId);
        const matchResult = determineMatchResult(parsedData as any, playerTeam);
        const totalRounds = parsedData.rounds.length;

        // Run analysis avec engine v2 (toujours)
        // Le ParserContext garantit que parsedData est au format v2
        // Si parser v1 utilisé, les champs v2 seront vides et les scores v2 seront null
        const analysisResult = await analysisEngineV2.analyzeDemo(parsedData, mainPlayerSteamId);

        // Si parser v1 utilisé, forcer les scores v2 à null
        if (!isV2Parser) {
          analysisResult.scores.movement = null;
          analysisResult.scores.awareness = null;
          analysisResult.scores.teamplay = null;
          analysisResult.analyses.movement = null;
          analysisResult.analyses.awareness = null;
          analysisResult.analyses.teamplay = null;
        }

        const coachingReport = coachingEngine.generateReport(analysisResult as any);

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
            const stats = extractPlayerStats(parsedData as any, player.steamId);
            const entryStats = calculateEntryStats(parsedData as any, player.steamId);
            const isMainPlayer = player.steamId === mainPlayerSteamId;
            const playerRating = calculateSimpleRating(stats.kills, stats.deaths, stats.assists, totalRounds);

            // Calculer les stats de trade v2 pour ce joueur
            const playerTrades = parsedData.trades.filter(
              (t) => t.traderId === player.steamId || t.originalVictimId === player.steamId
            );
            const tradesGiven = playerTrades.filter((t) => t.traderId === player.steamId).length;
            const tradesReceived = playerTrades.filter((t) => t.originalVictimId === player.steamId).length;

            // Calculer la durée moyenne de blind pour ce joueur
            const playerBlinds = parsedData.playerBlinds.filter((b) => b.victimSteamId === player.steamId);
            const avgBlindDuration = playerBlinds.length > 0
              ? playerBlinds.reduce((sum, b) => sum + b.duration, 0) / playerBlinds.length
              : null;

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
                // Nouveaux champs v2
                tradesGiven,
                tradesReceived,
                avgBlindDuration,
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
              // Version du système d'analyse
              version: analysisResult.metadata?.version || '2.0',
              // Scores principaux
              overallScore: analysisResult.scores.overall,
              aimScore: analysisResult.scores.aim,
              positioningScore: analysisResult.scores.positioning,
              utilityScore: analysisResult.scores.utility,
              economyScore: analysisResult.scores.economy,
              timingScore: analysisResult.scores.timing,
              decisionScore: analysisResult.scores.decision,
              // Nouveaux scores v2
              movementScore: analysisResult.scores.movement ?? null,
              awarenessScore: analysisResult.scores.awareness ?? null,
              teamplayScore: analysisResult.scores.teamplay ?? null,
              // Analyses détaillées originales
              aimAnalysis: analysisResult.analyses.aim as any,
              positioningAnalysis: analysisResult.analyses.positioning as any,
              utilityAnalysis: analysisResult.analyses.utility as any,
              economyAnalysis: analysisResult.analyses.economy as any,
              timingAnalysis: analysisResult.analyses.timing as any,
              decisionAnalysis: analysisResult.analyses.decision as any,
              // Nouvelles analyses v2
              movementAnalysis: analysisResult.analyses.movement as any ?? null,
              awarenessAnalysis: analysisResult.analyses.awareness as any ?? null,
              teamplayAnalysis: analysisResult.analyses.teamplay as any ?? null,
              // Forces et faiblesses
              strengths: analysisResult.strengths,
              weaknesses: analysisResult.weaknesses,
              // Recommandations v2
              recommendations: analysisResult.recommendations as any ?? [],
              coachingReport: coachingReport as any,
            },
          });

          await tx.demoPlayerStats.updateMany({
            where: { demoId, isMainPlayer: true },
            data: {
              rating: analysisResult.playerStats.rating,
              kast: analysisResult.playerStats.kast,
              assists: analysisResult.playerStats.assists,
              // Nouvelles stats v2 pour le joueur principal
              tradesGiven: analysisResult.playerStats.tradesGiven ?? 0,
              tradesReceived: analysisResult.playerStats.tradesReceived ?? 0,
            },
          });

          await tx.demo.update({
            where: { id: demoId },
            data: { status: 'COMPLETED', processingCompletedAt: new Date() },
          });
        });

        await boss.send(JOB_TYPES.UPDATE_USER_STATS, { userId });

        const totalTime = ((Date.now() - parseStartTime) / 1000).toFixed(1);
        console.log(
          `[${shortJobId}] Completed: ${parsedData.metadata.map} ` +
          `(${matchResult.scoreTeam1}-${matchResult.scoreTeam2}) in ${totalTime}s`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${shortJobId}] Failed: ${errorMessage}`);

        try {
          await prisma.demo.update({
            where: { id: demoId },
            data: {
              status: 'FAILED',
              statusMessage: errorMessage,
            },
          });
        } catch (_updateError) {
          // Demo may have been deleted, ignore
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

/**
 * Convertit les données v1 du parser vers le format v2
 * Utilisé comme fallback quand parser_v2.py n'est pas disponible
 */
function convertV1ToV2Format(v1Data: any): ParsedDemoDataV2 {
  return {
    version: '1.0-compat',
    metadata: {
      map: v1Data.metadata?.map || 'unknown',
      duration: v1Data.metadata?.duration || 0,
      tickrate: v1Data.metadata?.tickrate || 64,
      matchDate: v1Data.metadata?.matchDate || null,
    },
    players: v1Data.players || [],
    rounds: v1Data.rounds || [],
    kills: (v1Data.kills || []).map((k: any) => ({
      ...k,
      weaponCategory: 'other' as const,
      distance: 0,
    })),
    damages: (v1Data.damages || []).map((d: any) => ({
      ...d,
      weaponCategory: 'other' as const,
      damageArmor: 0,
      healthRemaining: 100,
      armorRemaining: 0,
    })),
    grenades: v1Data.grenades || [],
    playerBlinds: [], // Non disponible en v1
    bombEvents: [], // Non disponible en v1
    economyByRound: [], // Non disponible en v1
    purchases: [], // Non disponible en v1
    weaponFires: [], // Non disponible en v1
    positions: [], // Non disponible en v1
    clutches: [], // Sera calculé par le teamplay analyzer
    entryDuels: [], // Sera calculé par le teamplay analyzer
    trades: [], // Sera calculé par le teamplay analyzer
    parsingStats: {
      totalKills: v1Data.kills?.length || 0,
      totalDamages: v1Data.damages?.length || 0,
      totalGrenades: v1Data.grenades?.length || 0,
      totalBlinds: 0,
      totalBombEvents: 0,
      totalWeaponFires: 0,
      totalPositionSnapshots: 0,
      totalPurchases: 0,
    },
  };
}

/**
 * Convertit un résultat d'analyse v1 vers le format v2
 * Utilisé quand l'analyse v1 est utilisée comme fallback
 */
function convertV1AnalysisToV2(v1Result: any): AnalysisResultV2 {
  return {
    playerStats: {
      kills: v1Result.playerStats?.kills || 0,
      deaths: v1Result.playerStats?.deaths || 0,
      assists: v1Result.playerStats?.assists || 0,
      headshots: v1Result.playerStats?.headshots || 0,
      hsPercentage: v1Result.playerStats?.hsPercentage || 0,
      adr: v1Result.playerStats?.adr || 0,
      kast: v1Result.playerStats?.kast || 0,
      rating: v1Result.playerStats?.rating || 0,
      // Valeurs par défaut pour les nouvelles stats v2
      entryKills: v1Result.playerStats?.entryKills || 0,
      entryDeaths: v1Result.playerStats?.entryDeaths || 0,
      clutchWins: 0,
      clutchAttempts: 0,
      tradesGiven: 0,
      tradesReceived: 0,
    },
    scores: {
      overall: v1Result.scores?.overall || 50,
      aim: v1Result.scores?.aim || 50,
      positioning: v1Result.scores?.positioning || 50,
      utility: v1Result.scores?.utility || 50,
      economy: v1Result.scores?.economy || 50,
      timing: v1Result.scores?.timing || 50,
      decision: v1Result.scores?.decision || 50,
      // Scores v2 null quand parser v1 (données non disponibles)
      movement: null,
      awareness: null,
      teamplay: null,
    },
    analyses: {
      aim: v1Result.analyses?.aim || {},
      positioning: v1Result.analyses?.positioning || {},
      utility: v1Result.analyses?.utility || {},
      economy: v1Result.analyses?.economy || {},
      timing: v1Result.analyses?.timing || {},
      decision: v1Result.analyses?.decision || {},
      // Analyses v2 vides
      movement: null,
      awareness: null,
      teamplay: null,
    },
    strengths: v1Result.strengths || [],
    weaknesses: v1Result.weaknesses || [],
    recommendations: [], // Pas de recommandations en v1
    metadata: {
      version: '1.0-compat',
      analyzedAt: new Date().toISOString(),
      totalRounds: v1Result.metadata?.totalRounds || 0,
      map: v1Result.metadata?.map || 'unknown',
      duration: v1Result.metadata?.duration || 0,
    },
  };
}
