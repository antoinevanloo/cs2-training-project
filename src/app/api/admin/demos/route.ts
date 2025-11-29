import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdminAPI } from '@/lib/admin/guard';

export async function GET(request: NextRequest) {
  const adminUser = await requireAdminAPI();
  if (!adminUser) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { mapName: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [demos, total, stats] = await Promise.all([
    prisma.demo.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            playerStats: true,
          },
        },
        analysis: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.demo.count({ where }),
    // Get stats
    prisma.demo.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        fileSizeMb: true,
      },
    }),
  ]);

  // Process stats
  const demoStats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalSizeMb: 0,
  };

  for (const stat of stats) {
    demoStats.total += stat._count;
    demoStats.totalSizeMb += stat._sum.fileSizeMb || 0;

    switch (stat.status) {
      case 'PENDING':
        demoStats.pending = stat._count;
        break;
      case 'PROCESSING':
        demoStats.processing = stat._count;
        break;
      case 'COMPLETED':
        demoStats.completed = stat._count;
        break;
      case 'FAILED':
        demoStats.failed = stat._count;
        break;
    }
  }

  return NextResponse.json({
    demos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: demoStats,
  });
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminAPI();
  if (!adminUser) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json();
  const { action, demoId } = body;

  if (action === 'reprocess') {
    if (!demoId) {
      return NextResponse.json({ error: 'ID de demo requis' }, { status: 400 });
    }

    // Reset demo status to PENDING for reprocessing
    await prisma.demo.update({
      where: { id: demoId },
      data: {
        status: 'PENDING',
        statusMessage: null,
        processingCompletedAt: null,
      },
    });

    // TODO: Trigger the processing job here
    // For now, we just reset the status

    return NextResponse.json({ success: true, message: 'Demo remise en file de traitement' });
  }

  return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminAPI();
  if (!adminUser) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const demoId = request.nextUrl.searchParams.get('demoId');

  if (!demoId) {
    return NextResponse.json({ error: 'ID de demo requis' }, { status: 400 });
  }

  // Get demo info before deletion
  const demo = await prisma.demo.findUnique({
    where: { id: demoId },
    select: { fileSizeMb: true, userId: true },
  });

  if (!demo) {
    return NextResponse.json({ error: 'Demo non trouvée' }, { status: 404 });
  }

  // Delete demo and all related data (cascading should handle this)
  await prisma.demo.delete({
    where: { id: demoId },
  });

  // Update user's storage usage
  await prisma.user.update({
    where: { id: demo.userId },
    data: {
      storageUsedMb: {
        decrement: demo.fileSizeMb,
      },
    },
  });

  return NextResponse.json({ success: true, message: 'Demo supprimée' });
}
