import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { RoundsClient } from './RoundsClient';
import type { Round, RoundEvent } from '@/types/rounds';

interface Props {
  params: { id: string };
}

export const metadata = {
  title: 'Timeline des Rounds | CS2 Coach',
};

export default async function RoundsPage({ params }: Props) {
  const user = await requireAuth();

  // Recuperer la demo
  const demo = await prisma.demo.findUnique({
    where: { id: params.id },
    include: {
      playerStats: {
        where: { isMainPlayer: true },
        select: {
          steamId: true,
          team: true,
          playerName: true,
        },
      },
    },
  });

  if (!demo || demo.userId !== user.id) {
    notFound();
  }

  // Recuperer les rounds separement
  const roundsData = await prisma.round.findMany({
    where: { demoId: params.id },
    orderBy: { roundNumber: 'asc' },
  });

  // Transformer les donnees pour le client avec les types partages
  const rounds: Round[] = roundsData.map((round) => ({
    roundNumber: round.roundNumber,
    winnerTeam: round.winnerTeam,
    winReason: round.winReason,
    team1Money: round.team1Money,
    team2Money: round.team2Money,
    team1Equipment: round.team1Equipment,
    team2Equipment: round.team2Equipment,
    duration: round.duration,
    events: (round.events as unknown as RoundEvent[]) || [],
  }));

  const mainPlayer = demo.playerStats[0];

  return (
    <RoundsClient
      demoId={demo.id}
      mapName={demo.mapName}
      matchDate={demo.matchDate.toISOString()}
      scoreTeam1={demo.scoreTeam1}
      scoreTeam2={demo.scoreTeam2}
      matchResult={demo.matchResult}
      rounds={rounds}
      mainPlayerTeam={mainPlayer?.team || 1}
      mainPlayerSteamId={mainPlayer?.steamId || ''}
    />
  );
}
