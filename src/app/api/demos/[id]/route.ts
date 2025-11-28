import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { getDemoById, deleteDemo } from '@/lib/db/queries/demos';
import { deleteDemoFile } from '@/lib/storage/local';
import { updateUserStorageUsage } from '@/lib/db/queries/users';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const demo = await getDemoById(params.id);

    if (!demo) {
      return NextResponse.json(
        { error: 'Demo non trouvée' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (demo.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(demo);
  } catch (error) {
    console.error('Error fetching demo:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la demo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const demo = await getDemoById(params.id);

    if (!demo) {
      return NextResponse.json(
        { error: 'Demo non trouvée' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (demo.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Delete file from storage
    if (demo.localPath) {
      await deleteDemoFile(demo.localPath);
    }

    // Update user storage
    await updateUserStorageUsage(user.id, -demo.fileSizeMb);

    // Delete from database
    await deleteDemo(params.id);

    return NextResponse.json({ message: 'Demo supprimée' });
  } catch (error) {
    console.error('Error deleting demo:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la demo' },
      { status: 500 }
    );
  }
}
