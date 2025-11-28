import { KillEvent, PositionSnapshot } from '@/lib/demo-parser/types';
import { PositioningAnalysis } from '../types';

export class PositioningAnalyzer {
  analyze(
    deaths: KillEvent[],
    positions: PositionSnapshot[],
    mapName: string,
    playerSteamId: string
  ): PositioningAnalysis {
    // Analyze death positions
    const deathPositions = this.analyzeDeathPositions(deaths, mapName);

    // Identify common positioning mistakes
    const commonMistakes = this.identifyMistakes(deaths, deathPositions);

    // Calculate map control score (simplified)
    const mapControlScore = this.calculateMapControlScore(positions, playerSteamId);

    // Calculate rotation analysis (simplified)
    const rotationAnalysis = this.analyzeRotations(positions, playerSteamId);

    // Overall positioning score
    const positioningScore = this.calculateOverallScore(
      deathPositions,
      mapControlScore,
      commonMistakes.length
    );

    return {
      mapControl: {
        score: mapControlScore,
        avgAreaControlled: 0.35, // Would need map zone definitions
      },
      rotationSpeed: {
        average: rotationAnalysis.averageSpeed,
        optimal: 3.5,
      },
      deathPositions,
      commonMistakes,
      metrics: {
        mapControl: mapControlScore,
        positioning: positioningScore,
        rotations: Math.min(100, rotationAnalysis.score),
        deathQuality: 100 - deathPositions.filter((d) => d.isBadPosition).length * 10,
      },
    };
  }

  private analyzeDeathPositions(
    deaths: KillEvent[],
    _mapName: string
  ): Array<{ x: number; y: number; count: number; isBadPosition: boolean }> {
    // Group deaths by approximate position
    const positionMap: Record<string, { x: number; y: number; count: number }> = {};

    for (const death of deaths) {
      const { x, y } = death.victimPosition;
      // Round to grid (100 units)
      const gridX = Math.round(x / 100) * 100;
      const gridY = Math.round(y / 100) * 100;
      const key = `${gridX},${gridY}`;

      if (!positionMap[key]) {
        positionMap[key] = { x: gridX, y: gridY, count: 0 };
      }
      positionMap[key].count++;
    }

    // Mark positions with multiple deaths as potentially bad
    return Object.values(positionMap).map((pos) => ({
      ...pos,
      isBadPosition: pos.count >= 3, // Dying 3+ times in same spot is bad
    }));
  }

  private identifyMistakes(
    deaths: KillEvent[],
    deathPositions: Array<{ count: number; isBadPosition: boolean }>
  ): string[] {
    const mistakes: string[] = [];

    // Check for repeated death positions
    const badPositions = deathPositions.filter((p) => p.isBadPosition);
    if (badPositions.length > 0) {
      mistakes.push('repeated_death_positions');
    }

    // Check for through-smoke deaths (potential overpeek)
    const smokeDeaths = deaths.filter((d) => d.throughSmoke);
    if (smokeDeaths.length > deaths.length * 0.2) {
      mistakes.push('dying_through_smoke');
    }

    // Check for wallbang deaths (predictable positions)
    const wallbangDeaths = deaths.filter((d) => d.penetrated);
    if (wallbangDeaths.length > deaths.length * 0.15) {
      mistakes.push('predictable_positions');
    }

    // Check for blind deaths (bad timing)
    const blindDeaths = deaths.filter((d) => d.attackerBlind);
    if (blindDeaths.length > 0) {
      mistakes.push('dying_to_blind_players');
    }

    return mistakes;
  }

  private calculateMapControlScore(
    positions: PositionSnapshot[],
    playerSteamId: string
  ): number {
    // Without detailed map zone data, use simplified scoring
    // Base score of 60, adjusted by position variety
    if (positions.length === 0) return 60;

    // Calculate position variety
    const playerPositions = positions
      .map((p) => p.players.find((pl) => pl.steamId === playerSteamId))
      .filter((p) => p !== undefined);

    if (playerPositions.length < 10) return 60;

    // Check position variance
    const xPositions = playerPositions.map((p) => p!.x);
    const yPositions = playerPositions.map((p) => p!.y);

    const xVariance = this.calculateVariance(xPositions);
    const yVariance = this.calculateVariance(yPositions);

    // Higher variance = more map control
    const totalVariance = Math.sqrt(xVariance + yVariance);
    const normalizedVariance = Math.min(1, totalVariance / 1000);

    return Math.round(40 + normalizedVariance * 60);
  }

  private analyzeRotations(
    _positions: PositionSnapshot[],
    _playerSteamId: string
  ): { averageSpeed: number; score: number } {
    // Simplified rotation analysis
    return {
      averageSpeed: 4.0,
      score: 70,
    };
  }

  private calculateOverallScore(
    deathPositions: Array<{ isBadPosition: boolean }>,
    mapControlScore: number,
    mistakeCount: number
  ): number {
    const badPositionPenalty = deathPositions.filter((d) => d.isBadPosition).length * 5;
    const mistakePenalty = mistakeCount * 5;

    return Math.max(0, Math.min(100, mapControlScore - badPositionPenalty - mistakePenalty));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}
