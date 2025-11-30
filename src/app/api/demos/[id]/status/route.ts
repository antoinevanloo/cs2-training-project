import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const demoId = params.id;
    if (!demoId) {
      return NextResponse.json({ error: 'ID de démo manquant' }, { status: 400 });
    }

    const demo = await prisma.demo.findFirst({
      where: {
        id: demoId,
        userId: user.id, // Security check: user can only poll their own demos
      },
      select: {
        status: true,
        statusMessage: true,
      },
    });

    if (!demo) {
      return NextResponse.json({ error: 'Démo non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      status: demo.status,
      statusMessage: demo.statusMessage,
    });
  } catch (error) {
    console.error(`[API /demos/status]`, error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
