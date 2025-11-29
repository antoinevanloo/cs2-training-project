import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Créer un utilisateur de test (FREE)
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@cs2coach.com' },
    update: {},
    create: {
      email: 'demo@cs2coach.com',
      username: 'DemoPlayer',
      passwordHash: hashedPassword,
      steamId: '76561198000000000',
      steamUsername: 'DemoPlayer',
      systemRole: 'USER',
      subscriptionTier: 'FREE',
      preferredMaps: ['de_dust2', 'de_mirage', 'de_inferno'],
      role: 'ENTRY',
      rank: 'GOLD_NOVA',
      stats: {
        create: {
          totalDemos: 0,
          totalMatches: 0,
          totalRounds: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          avgRating: 0,
          avgAdr: 0,
          avgKast: 0,
          avgHsPercent: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        },
      },
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Créer un utilisateur admin
  const adminPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cs2coach.com' },
    update: {},
    create: {
      email: 'admin@cs2coach.com',
      username: 'Admin',
      passwordHash: adminPassword,
      systemRole: 'ADMIN',
      subscriptionTier: 'ENTERPRISE',
      preferredMaps: [],
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Créer un utilisateur PRO de test
  const proPassword = await bcrypt.hash('pro123', 12);

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@cs2coach.com' },
    update: {},
    create: {
      email: 'pro@cs2coach.com',
      username: 'ProPlayer',
      passwordHash: proPassword,
      steamId: '76561198000000001',
      steamUsername: 'ProPlayer',
      systemRole: 'USER',
      subscriptionTier: 'PRO',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      preferredMaps: ['de_mirage', 'de_inferno', 'de_anubis'],
      role: 'AWPER',
      rank: 'LEGENDARY_EAGLE',
      stats: {
        create: {
          totalDemos: 0,
          totalMatches: 0,
          totalRounds: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          avgRating: 0,
          avgAdr: 0,
          avgKast: 0,
          avgHsPercent: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        },
      },
    },
  });

  console.log('Created pro user:', proUser.email);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
