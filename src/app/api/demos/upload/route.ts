import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { saveDemoFile } from '@/lib/storage/local';
import { createDemo, getDemoByChecksum } from '@/lib/db/queries/demos';
import { checkStorageLimit, updateUserStorageUsage } from '@/lib/db/queries/users';
import { getJobQueue, JOB_TYPES } from '@/lib/jobs/queue';
import { storageConfig } from '@/lib/storage/config';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
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

    // Check storage limit
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
    const { filename, path: filePath, checksum, sizeMb } = await saveDemoFile(
      user.id,
      buffer,
      file.name
    );

    // Check for duplicate
    const existingDemo = await getDemoByChecksum(checksum);
    if (existingDemo) {
      return NextResponse.json(
        { error: 'Cette demo a déjà été uploadée' },
        { status: 409 }
      );
    }

    // Create demo record
    const demo = await createDemo({
      userId: user.id,
      filename,
      originalName: file.name,
      fileSizeMb: sizeMb,
      checksum,
      localPath: filePath,
    });

    // Update user storage usage
    await updateUserStorageUsage(user.id, sizeMb);

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
