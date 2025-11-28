import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Créer un utilisateur de test
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
      preferredMaps: ['de_dust2', 'de_mirage', 'de_inferno'],
      preferredRole: 'entry',
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
