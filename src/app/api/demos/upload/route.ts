import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { saveDemoFile, deleteDemoFile } from '@/lib/storage/local';
import { createDemo, getDemoByChecksum } from '@/lib/db/queries/demos';
import { checkStorageLimit, updateUserStorageUsage, getUserById } from '@/lib/db/queries/users';
import { getJobQueue, JOB_TYPES } from '@/lib/jobs/queue';
import { storageConfig } from '@/lib/storage/config';
import { validateDemoFile } from '@/lib/demo-parser/parser';
import {
  getUserSubscription,
  canUploadDemo,
  incrementDemoCount,
  resetDemoCountIfNeeded,
  getTierConfig,
  getEffectiveTier,
} from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a configuré son Steam ID
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.dem')) {
      return NextResponse.json(
        { error: 'Seuls les fichiers .dem sont acceptés' },
        { status: 400 }
      );
    }

    // Validate file size
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > storageConfig.maxUploadSizeMb) {
      return NextResponse.json(
        { error: `Le fichier ne doit pas dépasser ${storageConfig.maxUploadSizeMb} MB` },
        { status: 400 }
      );
    }

    // Reset demo count if new month
    await resetDemoCountIfNeeded(user.id);

    // Check subscription limits (demos per month + storage)
    const userSubscription = await getUserSubscription(user.id);
    if (!userSubscription) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
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

    // Check storage limit (legacy check - now handled by canUploadDemo)
    const hasSpace = await checkStorageLimit(user.id, fileSizeMb);
    if (!hasSpace) {
      return NextResponse.json(
        { error: 'Limite de stockage atteinte. Supprimez des demos ou archivez-les.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file to storage
    console.log('[Upload] Saving file for user:', user.id);
    const { filename, path: filePath, checksum, sizeMb } = await saveDemoFile(
      user.id,
      buffer,
      file.name
    );
    console.log('[Upload] File saved to:', filePath);

    // Check for duplicate
    const existingDemo = await getDemoByChecksum(checksum);
    if (existingDemo) {
      return NextResponse.json(
        { error: 'Cette demo a déjà été uploadée' },
        { status: 409 }
      );
    }

    // Récupérer la date de modification du fichier original (envoyée depuis le client)
    const fileLastModifiedStr = formData.get('fileLastModified') as string | null;
    let fileLastModified: Date | undefined;
    if (fileLastModifiedStr) {
      const timestamp = parseInt(fileLastModifiedStr, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        fileLastModified = new Date(timestamp);
      }
    }

    // Create demo record
    const demo = await createDemo({
      userId: user.id,
      filename,
      originalName: file.name,
      fileSizeMb: sizeMb,
      checksum,
      localPath: filePath,
      matchDate: fileLastModified, // Date du fichier original (sera mise à jour par le parser si disponible)
    });

    // Update user storage usage
    await updateUserStorageUsage(user.id, sizeMb);

    // Increment monthly demo count
    await incrementDemoCount(user.id);

    // Queue processing job
    try {
      const boss = await getJobQueue();
      await boss.send(JOB_TYPES.PROCESS_DEMO, {
        demoId: demo.id,
        userId: user.id,
        filePath,
      });

      // Update demo status to queued
      await import('@/lib/db/queries/demos').then(({ updateDemoStatus }) =>
        updateDemoStatus(demo.id, 'QUEUED')
      );
    } catch (jobError) {
      console.error('Failed to queue demo processing job:', jobError);
      // Continue anyway - the demo is saved
    }

    return NextResponse.json(
      {
        message: 'Demo uploadée avec succès',
        demo: {
          id: demo.id,
          filename: demo.filename,
          status: demo.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
