import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import prisma from '@/lib/db/prisma';
import { TIER_CONFIGS } from '@/lib/subscription/tiers';

/**
 * GET /api/admin/stats
 *
 * Retourne les statistiques globales de la plateforme
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    // Stats utilisateurs
    const [
      totalUsers,
      usersByTier,
      usersThisMonth,
      activeUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: thisMonthStart },
        },
      }),
    ]);

    // Stats demos
    const [
      totalDemos,
      demosByStatus,
      demosProcessedThisMonth,
      totalAnalyses,
    ] = await Promise.all([
      prisma.demo.count(),
      prisma.demo.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.demo.count({
        where: {
          status: 'COMPLETED',
          processingCompletedAt: { gte: thisMonthStart },
        },
      }),
      prisma.analysis.count(),
    ]);

    // Process demo status counts
    const demoStatusCounts = demosByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calcul MRR (Monthly Recurring Revenue)
    const tierCounts = usersByTier.reduce((acc, item) => {
      acc[item.subscriptionTier] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const mrr = Object.entries(tierCounts).reduce((total, [tier, count]) => {
      const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS];
      if (config && config.price.monthly > 0) {
        return total + config.price.monthly * count;
      }
      return total;
    }, 0);

    // Conversion rate (FREE -> Payant)
    const freeUsers = tierCounts['FREE'] || 0;
    const paidUsers = totalUsers - freeUsers;
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

    // Stockage utilisé total
    const storageStats = await prisma.user.aggregate({
      _sum: { storageUsedMb: true },
      _avg: { storageUsedMb: true },
    });

    // Calculate analysis rate
    const analysisRate = totalDemos > 0 ? (totalAnalyses / totalDemos) * 100 : 0;

    // Activité récente (dernières actions)
    const recentDemos = await prisma.demo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    // Time series data (simplified - just counts per day)
    const timeSeries: { date: string; users: number; demos: number }[] = [];

    // Return response in format expected by stats page
    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          byTier: tierCounts,
          newThisMonth: usersThisMonth,
          activeThisMonth: activeUsersThisMonth,
        },
        demos: {
          total: totalDemos,
          processedThisMonth: demosProcessedThisMonth,
          pendingProcessing: demoStatusCounts['PENDING'] || 0,
          failedProcessing: demoStatusCounts['FAILED'] || 0,
          avgProcessingTime: 0, // TODO: Calculate from actual processing times
        },
        storage: {
          totalUsedMb: storageStats._sum.storageUsedMb || 0,
          avgPerUser: storageStats._avg.storageUsedMb || 0,
        },
        coaching: {
          totalTips: totalAnalyses, // Using analyses count as coaching tips proxy
          avgTipsPerDemo: analysisRate / 100, // Convert back to ratio
        },
      },
      timeSeries,
      // Legacy format for backward compatibility with admin dashboard
      users: {
        total: totalUsers,
        byTier: tierCounts,
        new30Days: usersThisMonth,
        new7Days: usersThisMonth,
        paidUsers,
        freeUsers,
        conversionRate: conversionRate.toFixed(1),
      },
      demos: {
        total: totalDemos,
        byStatus: demoStatusCounts,
        new30Days: demosProcessedThisMonth,
        processingNow: (demoStatusCounts['PROCESSING'] || 0) + (demoStatusCounts['ANALYZING'] || 0),
      },
      revenue: {
        mrr,
        arr: mrr * 12,
      },
      storage: {
        totalUsedMb: storageStats._sum.storageUsedMb || 0,
        avgPerUserMb: storageStats._avg.storageUsedMb || 0,
      },
      recent: {
        demos: recentDemos,
        users: recentUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
