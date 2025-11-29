import prisma from '../prisma';
import { DemoFilters, PaginationParams } from '../types';
import { DemoStatus, MatchResult } from '@prisma/client';

export async function getDemoById(id: string) {
  return prisma.demo.findUnique({
    where: { id },
    include: {
      analysis: true,
      playerStats: {
        orderBy: { isMainPlayer: 'desc' },
      },
      rounds: {
        orderBy: { roundNumber: 'asc' },
      },
    },
  });
}

export async function getDemosByUserId(
  userId: string,
  pagination: PaginationParams = {}
) {
  const { page = 1, limit = 10, orderBy = 'matchDate', order = 'desc' } = pagination;
  const skip = (page - 1) * limit;

  const [demos, total] = await Promise.all([
    prisma.demo.findMany({
      where: { userId },
      orderBy: { [orderBy]: order },
      skip,
      take: limit,
      include: {
        analysis: {
          select: {
            overallScore: true,
            aimScore: true,
            positioningScore: true,
          },
        },
        playerStats: {
          where: { isMainPlayer: true },
          select: {
            kills: true,
            deaths: true,
            rating: true,
            adr: true,
          },
        },
      },
    }),
    prisma.demo.count({ where: { userId } }),
  ]);

  return {
    demos,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFilteredDemos(
  filters: DemoFilters,
  pagination: PaginationParams = {}
) {
  const { page = 1, limit = 10, orderBy = 'matchDate', order = 'desc' } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.mapName) where.mapName = filters.mapName;
  if (filters.status) where.status = filters.status as DemoStatus;
  if (filters.matchResult) where.matchResult = filters.matchResult as MatchResult;
  if (filters.startDate || filters.endDate) {
    where.matchDate = {};
    if (filters.startDate) where.matchDate.gte = filters.startDate;
    if (filters.endDate) where.matchDate.lte = filters.endDate;
  }

  const [demos, total] = await Promise.all([
    prisma.demo.findMany({
      where,
      orderBy: { [orderBy]: order },
      skip,
      take: limit,
      include: {
        analysis: {
          select: {
            overallScore: true,
          },
        },
        playerStats: {
          where: { isMainPlayer: true },
        },
      },
    }),
    prisma.demo.count({ where }),
  ]);

  return {
    demos,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createDemo(data: {
  userId: string;
  filename: string;
  originalName: string;
  fileSizeMb: number;
  checksum: string;
  localPath: string;
  mapName?: string;
  matchDate?: Date;
}) {
  return prisma.demo.create({
    data: {
      userId: data.userId,
      filename: data.filename,
      originalName: data.originalName,
      fileSizeMb: data.fileSizeMb,
      checksum: data.checksum,
      localPath: data.localPath,
      mapName: data.mapName || 'unknown',
      matchDate: data.matchDate || new Date(),
      duration: 0,
      scoreTeam1: 0,
      scoreTeam2: 0,
      playerTeam: 1,
      matchResult: 'TIE',
      status: 'PENDING',
    },
  });
}

export async function updateDemoStatus(
  id: string,
  status: DemoStatus,
  statusMessage?: string
) {
  const updateData: any = { status };

  if (statusMessage) {
    updateData.statusMessage = statusMessage;
  }

  if (status === 'PROCESSING') {
    updateData.processingStartedAt = new Date();
  }

  if (status === 'COMPLETED' || status === 'FAILED') {
    updateData.processingCompletedAt = new Date();
  }

  return prisma.demo.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteDemo(id: string) {
  return prisma.demo.delete({
    where: { id },
  });
}

export async function getDemoByChecksum(checksum: string) {
  return prisma.demo.findUnique({
    where: { checksum },
  });
}

export async function getRecentDemos(userId: string, limit = 5) {
  return prisma.demo.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    orderBy: { matchDate: 'desc' },
    take: limit,
    include: {
      analysis: {
        select: {
          overallScore: true,
        },
      },
      playerStats: {
        where: { isMainPlayer: true },
        select: {
          kills: true,
          deaths: true,
          rating: true,
        },
      },
    },
  });
}

export async function getPendingDemos(limit = 10) {
  return prisma.demo.findMany({
    where: {
      status: {
        in: ['PENDING', 'QUEUED'],
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}
