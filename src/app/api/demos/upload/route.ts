import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { saveDemoFile, deleteDemoFile } from '@/lib/storage/local';
import { getDemoByChecksum } from '@/lib/db/queries/demos';
import { getUserById } from '@/lib/db/queries/users';
import { getJobQueue, JOB_TYPES } from '@/lib/jobs/queue';
import { storageConfig } from '@/lib/storage/config';
import {
  getUserSubscription,
  canUploadDemo,
  resetDemoCountIfNeeded,
  getTierConfig,
  getEffectiveTier,
} from '@/lib/subscription';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
  const user = await requireAuthAPI();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let savedFilePath: string | null = null;
  let demoId: string | null = null;
  let fileSizeMb = 0;
  let transactionCompleted = false;

  try {
    const fullUser = await getUserById(user.id);
    if (!fullUser?.steamId) {
      return NextResponse.json(
        {
          error: 'Steam ID requis',
          message: 'Vous devez configurer votre Steam ID dans les paramètres avant de pouvoir uploader des demos.',
          redirect: '/dashboard/settings',
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.dem')) {
      return NextResponse.json({ error: 'Seuls les fichiers .dem sont acceptés' }, { status: 400 });
    }

    fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > storageConfig.maxUploadSizeMb) {
      return NextResponse.json({ error: `Le fichier ne doit pas dépasser ${storageConfig.maxUploadSizeMb} MB` }, { status: 400 });
    }

    await resetDemoCountIfNeeded(user.id);

    const userSubscription = await getUserSubscription(user.id);
    if (!userSubscription) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const uploadPermission = await canUploadDemo(userSubscription, fileSizeMb);
    if (!uploadPermission.allowed) {
      const tierConfig = getTierConfig(getEffectiveTier(userSubscription));
      return NextResponse.json(
        {
          error: uploadPermission.reason,
          upgradeRequired: uploadPermission.upgradeRequired,
          currentTier: getEffectiveTier(userSubscription),
          limits: tierConfig.limits,
        },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { filename, path: filePath, checksum, sizeMb } = await saveDemoFile(user.id, buffer, file.name);
    savedFilePath = filePath;

    const existingDemo = await getDemoByChecksum(checksum);
    if (existingDemo) {
      await deleteDemoFile(filePath);
      return NextResponse.json({ error: 'Cette demo a déjà été uploadée' }, { status: 409 });
    }

    const fileLastModifiedStr = formData.get('fileLastModified') as string | null;
    let fileLastModified: Date | undefined;
    if (fileLastModifiedStr) {
      const timestamp = parseInt(fileLastModifiedStr, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        fileLastModified = new Date(timestamp);
      }
    }

    const newDemo = await prisma.$transaction(async (tx) => {
      const demo = await tx.demo.create({
        data: {
          userId: user.id,
          filename,
          originalName: file.name,
          fileSizeMb: sizeMb,
          checksum,
          localPath: filePath,
          matchDate: fileLastModified || new Date(),
          mapName: 'pending',
          duration: 0,
          scoreTeam1: 0,
          scoreTeam2: 0,
          playerTeam: 0,
          matchResult: 'TIE',
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          storageUsedMb: { increment: sizeMb },
          demosThisMonth: { increment: 1 },
        },
      });
      
      return demo;
    });
    
    demoId = newDemo.id;
    transactionCompleted = true;

    try {
      const boss = await getJobQueue();
      await boss.send(JOB_TYPES.PROCESS_DEMO, {
        demoId: newDemo.id,
        userId: user.id,
        filePath,
      });

      await prisma.demo.update({
        where: { id: newDemo.id },
        data: { status: 'QUEUED' },
      });
    } catch (jobError) {
      console.error('Failed to queue demo processing job:', jobError);
      throw new Error('Failed to queue processing job.');
    }

    return NextResponse.json(
      {
        message: 'Demo uploadée avec succès et mise en file d\'attente pour traitement.',
        demo: {
          id: newDemo.id,
          filename: newDemo.filename,
          status: 'QUEUED',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);

    // Cleanup logic
    if (savedFilePath) {
      console.log(`[Upload Error] Cleaning up saved file at ${savedFilePath}`);
      await deleteDemoFile(savedFilePath).catch(e => console.error("Cleanup failed for file:", e));
    }
    
    if (transactionCompleted && demoId) {
        console.log(`[Upload Error] Rolling back transaction effects for demo ${demoId}`);
        // This part is tricky because the transaction is already committed.
        // We need to manually reverse the operations.
        await prisma.demo.delete({ where: { id: demoId } }).catch(e => console.error("Cleanup failed for demo DB entry:", e));
        await prisma.user.update({
            where: { id: user.id },
            data: {
                storageUsedMb: { decrement: fileSizeMb },
                demosThisMonth: { decrement: 1 },
            }
        }).catch(e => console.error("Cleanup failed for user stats:", e));
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de l\'upload. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
