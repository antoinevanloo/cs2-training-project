import { KillEvent, DamageEvent, PositionSnapshot, HITGROUP } from '@/lib/demo-parser/types';
import { AimAnalysis } from '../types';

export class AimAnalyzer {
  analyze(
    kills: KillEvent[],
    damages: DamageEvent[],
    _positions: PositionSnapshot[],
    _playerSteamId: string
  ): AimAnalysis {
    const totalKills = kills.length;
    const headshots = kills.filter((k) => k.headshot).length;
    const hsPercentage = totalKills > 0 ? headshots / totalKills : 0;

    // Calculate accuracy from damage events
    const headshotDamages = damages.filter((d) => d.hitgroup === HITGROUP.HEAD);
    const totalHits = damages.length;
    const _headHits = headshotDamages.length;

    // Estimate first bullet accuracy
    // Group damages by tick proximity to estimate bursts
    const firstBulletAccuracy = this.estimateFirstBulletAccuracy(damages);

    // Estimate spray control based on headshot ratio in multi-kills
    const sprayControlScore = this.estimateSprayControl(kills, damages);

    // Estimate reaction time (simplified - would need tick-precise death positions)
    const reactionTime = this.estimateReactionTime(kills);

    // Crosshair placement score based on headshot hit rate
    const crosshairScore = Math.min(100, hsPercentage * 150); // HS% of 66% = 100

    return {
      crosshairPlacement: {
        score: Math.round(crosshairScore),
        headLevelTime: hsPercentage,
      },
      reactionTime: {
        average: reactionTime.average,
        best: reactionTime.best,
      },
      accuracy: {
        overall: totalHits > 0 ? totalHits / (totalHits * 2) : 0, // Simplified
        headshot: hsPercentage,
      },
      sprayControl: {
        score: sprayControlScore,
        transferSpeed: 0.4, // Would need positional data
      },
      firstBulletAccuracy,
      metrics: {
        crosshairPlacement: crosshairScore,
        accuracy: hsPercentage * 100,
        sprayControl: sprayControlScore,
        reactionTime: Math.max(0, 100 - (reactionTime.average - 150) / 2),
      },
    };
  }

  private estimateFirstBulletAccuracy(damages: DamageEvent[]): number {
    if (damages.length === 0) return 0.3;

    // Group damages by round and estimate first shots
    const damagesByRound: Record<number, DamageEvent[]> = {};
    for (const damage of damages) {
      if (!damagesByRound[damage.round]) {
        damagesByRound[damage.round] = [];
      }
      damagesByRound[damage.round].push(damage);
    }

    let firstShots = 0;
    let firstShotHeadshots = 0;

    for (const round in damagesByRound) {
      const roundDamages = damagesByRound[round].sort((a, b) => a.tick - b.tick);

      // Consider first damage in each engagement (>500ms gap)
      let lastTick = 0;
      const tickGap = 64; // ~500ms at 128 tick

      for (const damage of roundDamages) {
        if (damage.tick - lastTick > tickGap) {
          firstShots++;
          if (damage.hitgroup === HITGROUP.HEAD) {
            firstShotHeadshots++;
          }
        }
        lastTick = damage.tick;
      }
    }

    return firstShots > 0 ? firstShotHeadshots / firstShots : 0.3;
  }

  private estimateSprayControl(kills: KillEvent[], _damages: DamageEvent[]): number {
    // Estimate based on multi-kill consistency
    const totalKills = kills.length;
    if (totalKills < 5) return 50; // Not enough data

    // Count headshots in rapid succession (spray transfers)
    let sprayKills = 0;
    let sprayHeadshots = 0;
    const sortedKills = [...kills].sort((a, b) => a.tick - b.tick);

    for (let i = 1; i < sortedKills.length; i++) {
      const timeDiff = sortedKills[i].tick - sortedKills[i - 1].tick;
      if (timeDiff < 64) {
        // Less than 500ms apart
        sprayKills++;
        if (sortedKills[i].headshot) {
          sprayHeadshots++;
        }
      }
    }

    if (sprayKills === 0) return 60; // No spray transfers detected

    const sprayHsRate = sprayHeadshots / sprayKills;
    return Math.min(100, Math.round(40 + sprayHsRate * 60));
  }

  private estimateReactionTime(kills: KillEvent[]): { average: number; best: number } {
    // Without precise tick data for player awareness, estimate based on kill patterns
    // Real implementation would need player view angles and enemy visibility

    // Use statistical estimates based on common player data
    const baseReaction = 250; // Average human reaction time

    // Faster reactions for through-smoke or blind kills indicate good prediction
    const skillfulKills = kills.filter((k) => k.throughSmoke || k.attackerBlind);
    const quickKillRatio = skillfulKills.length / Math.max(1, kills.length);

    const estimatedAverage = baseReaction - quickKillRatio * 50;
    const estimatedBest = estimatedAverage - 70;

    return {
      average: Math.round(Math.max(150, estimatedAverage)),
      best: Math.round(Math.max(100, estimatedBest)),
    };
  }
}
