/**
 * API Steam Demo Download
 *
 * POST /api/steam/matches/download - Télécharge une démo depuis Steam
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { getMatchDetails } from '@/lib/steam/match-history';
import { downloadDemo, calculateChecksum, isDemoAlreadyDownloaded } from '@/lib/steam/demo-downloader';
import { z } from 'zod';
import path from 'path';

// Validation du body
const DownloadRequestSchema = z.object({
  shareCode: z.string().regex(/^CSGO-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/, {
    message: 'Format de share code invalide (ex: CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx)',
  }),
  // Optionnel: URL directe si déjà connue
  demoUrl: z.string().url().optional(),
});

/**
 * POST /api/steam/matches/download
 *
 * Télécharge une démo et l'ajoute à la bibliothèque de l'utilisateur
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = DownloadRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { shareCode, demoUrl: providedDemoUrl } = validated.data;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        steamId: true,
        storageUsedMb: true,
        maxStorageMb: true,
        demosThisMonth: true,
        demosResetAt: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.steamId) {
      return NextResponse.json(
        {
          error: 'Steam ID requis',
          code: 'STEAM_ID_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Vérifier les quotas
    const tierLimits: Record<string, { demosPerMonth: number; storageMb: number }> = {
      FREE: { demosPerMonth: 5, storageMb: 500 },
      STARTER: { demosPerMonth: 50, storageMb: 1000 },
      PRO: { demosPerMonth: 200, storageMb: 5000 },
      TEAM: { demosPerMonth: 500, storageMb: 50000 },
      ENTERPRISE: { demosPerMonth: 9999, storageMb: 100000 },
    };

    const limits = tierLimits[user.subscriptionTier] || tierLimits.FREE;

    // Reset mensuel si nécessaire
    const now = new Date();
    const resetDate = new Date(user.demosResetAt);
    let currentDemosThisMonth = user.demosThisMonth;

    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      currentDemosThisMonth = 0;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          demosThisMonth: 0,
          demosResetAt: now,
        },
      });
    }

    if (currentDemosThisMonth >= limits.demosPerMonth) {
      return NextResponse.json(
        {
          error: 'Limite mensuelle atteinte',
          code: 'MONTHLY_LIMIT_REACHED',
          limit: limits.demosPerMonth,
          used: currentDemosThisMonth,
        },
        { status: 429 }
      );
    }

    // Récupérer les détails du match
    const matchDetails = await getMatchDetails(shareCode);

    if (!matchDetails) {
      return NextResponse.json(
        {
          error: 'Match non trouvé ou expiré',
          code: 'MATCH_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const demoUrl = providedDemoUrl || matchDetails.demoUrl;

    if (!demoUrl) {
      return NextResponse.json(
        {
          error: 'URL de démo non disponible',
          code: 'DEMO_URL_NOT_AVAILABLE',
        },
        { status: 404 }
      );
    }

    // Vérifier si la démo existe déjà
    const storagePath = process.env.STORAGE_PATH || '/data';
    const userDemoDir = path.join(storagePath, 'demos', user.id);
    const filename = `${matchDetails.map}_${matchDetails.matchId}_${Date.now()}.dem`;

    const alreadyDownloaded = await isDemoAlreadyDownloaded(matchDetails.matchId, userDemoDir);

    if (alreadyDownloaded.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette démo a déjà été téléchargée',
          code: 'DEMO_ALREADY_EXISTS',
          existingPath: alreadyDownloaded.path,
        },
        { status: 409 }
      );
    }

    // Vérifier l'espace disponible (estimation: 100MB par démo)
    const estimatedSizeMb = 100;
    if (user.storageUsedMb + estimatedSizeMb > user.maxStorageMb) {
      return NextResponse.json(
        {
          error: 'Espace de stockage insuffisant',
          code: 'STORAGE_LIMIT_REACHED',
          used: user.storageUsedMb,
          max: user.maxStorageMb,
        },
        { status: 507 }
      );
    }

    // Télécharger la démo
    const downloadResult = await downloadDemo(demoUrl, userDemoDir, filename);

    if (!downloadResult.success) {
      return NextResponse.json(
        {
          error: downloadResult.error || 'Échec du téléchargement',
          code: 'DOWNLOAD_FAILED',
        },
        { status: 502 }
      );
    }

    // Calculer le checksum
    const checksum = await calculateChecksum(downloadResult.localPath!);

    // Vérifier si une démo avec le même checksum existe déjà
    const existingDemo = await prisma.demo.findUnique({
      where: { checksum },
    });

    if (existingDemo) {
      // Supprimer le fichier téléchargé (doublon)
      const fs = await import('fs/promises');
      await fs.unlink(downloadResult.localPath!).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          error: 'Cette démo existe déjà dans votre bibliothèque',
          code: 'DEMO_DUPLICATE',
          existingDemoId: existingDemo.id,
        },
        { status: 409 }
      );
    }

    // Créer l'entrée en base de données
    const demo = await prisma.demo.create({
      data: {
        userId: user.id,
        filename,
        originalName: `${matchDetails.map}_${shareCode}.dem`,
        fileSizeMb: downloadResult.fileSizeMb || 0,
        checksum,
        mapName: matchDetails.map,
        gameMode: matchDetails.gameMode,
        matchDate: matchDetails.matchTime,
        duration: matchDetails.duration,
        scoreTeam1: matchDetails.score.team1,
        scoreTeam2: matchDetails.score.team2,
        playerTeam: 1, // Sera déterminé lors de l'analyse
        matchResult: matchDetails.score.team1 > matchDetails.score.team2 ? 'WIN' :
                     matchDetails.score.team1 < matchDetails.score.team2 ? 'LOSS' : 'TIE',
        status: 'PENDING',
        localPath: downloadResult.localPath,
        metadata: {
          shareCode,
          steamMatchId: matchDetails.matchId,
          downloadedAt: new Date().toISOString(),
          downloadSource: 'steam_auto',
        },
      },
    });

    // Mettre à jour les quotas utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        demosThisMonth: { increment: 1 },
        storageUsedMb: { increment: downloadResult.fileSizeMb || 0 },
      },
    });

    // Créer le job de traitement (si pg-boss est configuré)
    try {
      const { getJobQueue, JOB_TYPES } = await import('@/lib/jobs/queue');
      const queue = await getJobQueue();
      await queue.send(JOB_TYPES.PROCESS_DEMO, {
        demoId: demo.id,
        userId: user.id,
        filePath: downloadResult.localPath,
      });

      await prisma.demo.update({
        where: { id: demo.id },
        data: { status: 'QUEUED' },
      });
    } catch (jobError) {
      console.warn('Failed to create job, demo will remain in PENDING status:', jobError);
    }

    return NextResponse.json({
      success: true,
      demo: {
        id: demo.id,
        filename: demo.filename,
        map: demo.mapName,
        matchDate: demo.matchDate,
        score: `${demo.scoreTeam1} - ${demo.scoreTeam2}`,
        fileSizeMb: demo.fileSizeMb,
        status: demo.status,
      },
      message: 'Démo téléchargée avec succès',
    });
  } catch (error) {
    console.error('Error downloading Steam demo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}