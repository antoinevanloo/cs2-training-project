'use client';

import { CS2Rank } from '@prisma/client';
import { RankComparison } from './RankComparison';

interface PlayerStats {
  rating: number;
  adr: number;
  kast: number;
  hsPercent: number;
}

interface RankComparisonWrapperProps {
  playerStats: PlayerStats;
  currentRank?: CS2Rank | null;
  targetRank?: CS2Rank | null;
}

export function RankComparisonWrapper({
  playerStats,
  currentRank,
  targetRank,
}: RankComparisonWrapperProps) {
  const handleTargetRankChange = async (rank: CS2Rank) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRank: rank }),
      });

      if (!response.ok) {
        console.error('Failed to update target rank');
      }
    } catch (error) {
      console.error('Error updating target rank:', error);
    }
  };

  return (
    <RankComparison
      playerStats={playerStats}
      currentRank={currentRank}
      targetRank={targetRank}
      onTargetRankChange={handleTargetRankChange}
    />
  );
}