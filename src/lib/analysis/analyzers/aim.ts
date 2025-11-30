import { KillEvent, DamageEvent, PositionSnapshot, HITGROUP } from '@/lib/demo-parser/types';
import { AimAnalysis } from '../types';

// Weapon categories for analysis
const RIFLE_WEAPONS = ['ak47', 'weapon_ak47', 'm4a1', 'weapon_m4a1', 'm4a1_silencer', 'weapon_m4a1_silencer', 'sg556', 'weapon_sg556', 'aug', 'weapon_aug', 'galil', 'weapon_galilar', 'famas', 'weapon_famas'];
const AWP_WEAPONS = ['awp', 'weapon_awp'];
const PISTOL_WEAPONS = ['glock', 'weapon_glock', 'usp', 'weapon_usp_silencer', 'p2000', 'weapon_hkp2000', 'deagle', 'weapon_deagle', 'p250', 'weapon_p250', 'fiveseven', 'weapon_fiveseven', 'tec9', 'weapon_tec9'];
const SMG_WEAPONS = ['mp9', 'weapon_mp9', 'mac10', 'weapon_mac10', 'mp7', 'weapon_mp7', 'ump45', 'weapon_ump45', 'p90', 'weapon_p90'];

interface WeaponStats {
  hits: number;
  headshots: number;
  kills: number;
  damage: number;
}

interface SprayAnalysis {
  sprayKills: number;
  sprayHeadshots: number;
  avgBulletsToKill: number;
  sprayTransfers: number;
  successfulTransfers: number;
}

interface DuelAnalysis {
  duelsWon: number;
  duelsLost: number;
  avgTimeToKill: number; // in ticks
  openingDuels: number;
  openingWins: number;
}

export class AimAnalyzer {
  analyze(
    kills: KillEvent[],
    damages: DamageEvent[],
    positions: PositionSnapshot[],
    playerSteamId: string
  ): AimAnalysis {
    const totalKills = kills.length;
    const headshots = kills.filter((k) => k.headshot).length;
    const hsPercentage = totalKills > 0 ? headshots / totalKills : 0;

    // Detailed weapon accuracy analysis
    const weaponStats = this.analyzeWeaponAccuracy(damages, kills, playerSteamId);

    // Spray control analysis
    const sprayAnalysis = this.analyzeSprayControl(kills, damages, playerSteamId);

    // Duel performance
    const duelAnalysis = this.analyzeDuels(kills, damages, playerSteamId);

    // First bullet accuracy
    const firstBulletAccuracy = this.calculateFirstBulletAccuracy(damages, playerSteamId);

    // Crosshair placement score based on headshot distribution
    const crosshairScore = this.calculateCrosshairScore(damages, kills, playerSteamId);

    // Reaction time estimation
    const reactionTime = this.estimateReactionTime(kills, damages, positions, playerSteamId);

    // Calculate spray control score
    const sprayControlScore = this.calculateSprayScore(sprayAnalysis);

    // Overall accuracy
    const overallAccuracy = this.calculateOverallAccuracy(damages, playerSteamId);

    // Collect individual kill positions for heatmap
    const killPositions = kills
      .filter(k => k.attackerSteamId === playerSteamId)
      .map(k => ({
        x: k.attackerPosition.x,
        y: k.attackerPosition.y,
        round: k.round,
        weapon: k.weapon,
        wasHeadshot: k.headshot,
      }));

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
        overall: overallAccuracy,
        headshot: hsPercentage,
      },
      sprayControl: {
        score: sprayControlScore,
        transferSpeed: sprayAnalysis.sprayTransfers > 0
          ? sprayAnalysis.successfulTransfers / sprayAnalysis.sprayTransfers
          : 0.5,
      },
      firstBulletAccuracy,
      metrics: {
        crosshairPlacement: crosshairScore,
        accuracy: overallAccuracy * 100,
        sprayControl: sprayControlScore,
        reactionTime: Math.max(0, 100 - (reactionTime.average - 150) / 2),
        // Additional detailed metrics
        rifleHsRate: weaponStats.rifles.hits > 0 ? (weaponStats.rifles.headshots / weaponStats.rifles.hits) * 100 : 0,
        pistolHsRate: weaponStats.pistols.hits > 0 ? (weaponStats.pistols.headshots / weaponStats.pistols.hits) * 100 : 0,
        duelWinRate: duelAnalysis.duelsWon + duelAnalysis.duelsLost > 0
          ? (duelAnalysis.duelsWon / (duelAnalysis.duelsWon + duelAnalysis.duelsLost)) * 100
          : 50,
        openingDuelWinRate: duelAnalysis.openingDuels > 0
          ? (duelAnalysis.openingWins / duelAnalysis.openingDuels) * 100
          : 50,
        sprayTransferSuccess: sprayAnalysis.sprayTransfers > 0
          ? (sprayAnalysis.successfulTransfers / sprayAnalysis.sprayTransfers) * 100
          : 50,
      },
      killPositions,
    };
  }

  private analyzeWeaponAccuracy(
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): { rifles: WeaponStats; pistols: WeaponStats; smgs: WeaponStats; awp: WeaponStats } {
    const stats = {
      rifles: { hits: 0, headshots: 0, kills: 0, damage: 0 },
      pistols: { hits: 0, headshots: 0, kills: 0, damage: 0 },
      smgs: { hits: 0, headshots: 0, kills: 0, damage: 0 },
      awp: { hits: 0, headshots: 0, kills: 0, damage: 0 },
    };

    // Analyze damages
    for (const damage of damages) {
      if (damage.attackerSteamId !== playerSteamId) continue;

      const weapon = damage.weapon.toLowerCase();
      const isHeadshot = damage.hitgroup === HITGROUP.HEAD;

      if (RIFLE_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.rifles.hits++;
        if (isHeadshot) stats.rifles.headshots++;
        stats.rifles.damage += damage.damage;
      } else if (PISTOL_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.pistols.hits++;
        if (isHeadshot) stats.pistols.headshots++;
        stats.pistols.damage += damage.damage;
      } else if (SMG_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.smgs.hits++;
        if (isHeadshot) stats.smgs.headshots++;
        stats.smgs.damage += damage.damage;
      } else if (AWP_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.awp.hits++;
        if (isHeadshot) stats.awp.headshots++;
        stats.awp.damage += damage.damage;
      }
    }

    // Count kills per weapon type
    for (const kill of kills) {
      if (kill.attackerSteamId !== playerSteamId) continue;

      const weapon = kill.weapon.toLowerCase();

      if (RIFLE_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.rifles.kills++;
      } else if (PISTOL_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.pistols.kills++;
      } else if (SMG_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.smgs.kills++;
      } else if (AWP_WEAPONS.some(w => weapon.includes(w.replace('weapon_', '')))) {
        stats.awp.kills++;
      }
    }

    return stats;
  }

  private analyzeSprayControl(
    kills: KillEvent[],
    damages: DamageEvent[],
    playerSteamId: string
  ): SprayAnalysis {
    const analysis: SprayAnalysis = {
      sprayKills: 0,
      sprayHeadshots: 0,
      avgBulletsToKill: 0,
      sprayTransfers: 0,
      successfulTransfers: 0,
    };

    // Group kills by round and sort by tick
    const killsByRound: Record<number, KillEvent[]> = {};
    for (const kill of kills) {
      if (kill.attackerSteamId !== playerSteamId) continue;
      if (!killsByRound[kill.round]) {
        killsByRound[kill.round] = [];
      }
      killsByRound[kill.round].push(kill);
    }

    // Analyze spray patterns per round
    let totalBulletsToKill = 0;
    let killsWithBulletCount = 0;

    for (const round in killsByRound) {
      const roundKills = killsByRound[round].sort((a, b) => a.tick - b.tick);
      const roundDamages = damages
        .filter(d => d.attackerSteamId === playerSteamId && d.round === parseInt(round))
        .sort((a, b) => a.tick - b.tick);

      // Find spray sequences (kills within 32 ticks = ~250ms at 128 tick)
      for (let i = 1; i < roundKills.length; i++) {
        const timeDiff = roundKills[i].tick - roundKills[i - 1].tick;

        if (timeDiff < 64) { // Less than 500ms = spray transfer
          analysis.sprayTransfers++;
          analysis.sprayKills++;

          if (roundKills[i].headshot) {
            analysis.sprayHeadshots++;
            analysis.successfulTransfers++;
          } else {
            // Check if kill was fast enough to be considered successful
            if (timeDiff < 32) { // Very fast transfer
              analysis.successfulTransfers++;
            }
          }
        }
      }

      // Estimate bullets to kill using damage events
      for (const kill of roundKills) {
        // Find damages to this victim leading up to the kill
        const damagesToVictim = roundDamages.filter(
          d => d.victimSteamId === kill.victimSteamId &&
               d.tick <= kill.tick &&
               d.tick > kill.tick - 128 // Within 1 second before kill
        );

        if (damagesToVictim.length > 0) {
          totalBulletsToKill += damagesToVictim.length;
          killsWithBulletCount++;
        }
      }
    }

    analysis.avgBulletsToKill = killsWithBulletCount > 0
      ? totalBulletsToKill / killsWithBulletCount
      : 4; // Default estimate

    return analysis;
  }

  private analyzeDuels(
    kills: KillEvent[],
    damages: DamageEvent[],
    playerSteamId: string
  ): DuelAnalysis {
    const analysis: DuelAnalysis = {
      duelsWon: 0,
      duelsLost: 0,
      avgTimeToKill: 0,
      openingDuels: 0,
      openingWins: 0,
    };

    // Group events by round
    const eventsByRound: Record<number, { kills: KillEvent[]; deaths: KillEvent[] }> = {};

    for (const kill of kills) {
      if (!eventsByRound[kill.round]) {
        eventsByRound[kill.round] = { kills: [], deaths: [] };
      }

      if (kill.attackerSteamId === playerSteamId) {
        eventsByRound[kill.round].kills.push(kill);
        analysis.duelsWon++;
      } else if (kill.victimSteamId === playerSteamId) {
        eventsByRound[kill.round].deaths.push(kill);
        analysis.duelsLost++;
      }
    }

    // Analyze opening duels (first kill of each round)
    for (const round in eventsByRound) {
      const { kills: roundKills, deaths: roundDeaths } = eventsByRound[round];

      // Sort all round events to find opening duel
      const allEvents = [
        ...roundKills.map(k => ({ ...k, isPlayerKill: true })),
        ...roundDeaths.map(k => ({ ...k, isPlayerKill: false })),
      ].sort((a, b) => a.tick - b.tick);

      if (allEvents.length > 0) {
        const firstEvent = allEvents[0];
        // Check if player was involved in first kill of round
        if (firstEvent.attackerSteamId === playerSteamId ||
            firstEvent.victimSteamId === playerSteamId) {
          analysis.openingDuels++;
          if (firstEvent.attackerSteamId === playerSteamId) {
            analysis.openingWins++;
          }
        }
      }
    }

    // Calculate average time to kill from damage events
    let totalTimeToKill = 0;
    let duelCount = 0;

    for (const kill of kills) {
      if (kill.attackerSteamId !== playerSteamId) continue;

      // Find first damage to this victim in this round
      const firstDamage = damages.find(
        d => d.attackerSteamId === playerSteamId &&
             d.victimSteamId === kill.victimSteamId &&
             d.round === kill.round &&
             d.tick < kill.tick
      );

      if (firstDamage) {
        totalTimeToKill += kill.tick - firstDamage.tick;
        duelCount++;
      }
    }

    analysis.avgTimeToKill = duelCount > 0 ? totalTimeToKill / duelCount : 32; // ~250ms default

    return analysis;
  }

  private calculateFirstBulletAccuracy(damages: DamageEvent[], playerSteamId: string): number {
    if (damages.length === 0) return 0.3;

    // Group damages by round
    const damagesByRound: Record<number, DamageEvent[]> = {};
    for (const damage of damages) {
      if (damage.attackerSteamId !== playerSteamId) continue;
      if (!damagesByRound[damage.round]) {
        damagesByRound[damage.round] = [];
      }
      damagesByRound[damage.round].push(damage);
    }

    let firstShots = 0;
    let firstShotHeadshots = 0;

    for (const round in damagesByRound) {
      const roundDamages = damagesByRound[round].sort((a, b) => a.tick - b.tick);

      // Track engagements (>500ms gap = new engagement)
      let lastTick = 0;
      let lastVictim = '';
      const tickGap = 64; // ~500ms at 128 tick

      for (const damage of roundDamages) {
        // New engagement if: enough time passed OR different victim
        const isNewEngagement = damage.tick - lastTick > tickGap ||
                                damage.victimSteamId !== lastVictim;

        if (isNewEngagement) {
          firstShots++;
          if (damage.hitgroup === HITGROUP.HEAD) {
            firstShotHeadshots++;
          }
        }

        lastTick = damage.tick;
        lastVictim = damage.victimSteamId;
      }
    }

    return firstShots > 0 ? firstShotHeadshots / firstShots : 0.3;
  }

  private calculateCrosshairScore(
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): number {
    const playerDamages = damages.filter(d => d.attackerSteamId === playerSteamId);
    if (playerDamages.length === 0) return 50;

    // Analyze hitgroup distribution
    const hitgroupCounts: Record<number, number> = {};
    for (const damage of playerDamages) {
      hitgroupCounts[damage.hitgroup] = (hitgroupCounts[damage.hitgroup] || 0) + 1;
    }

    const totalHits = playerDamages.length;
    const headHits = hitgroupCounts[HITGROUP.HEAD] || 0;
    const chestHits = hitgroupCounts[HITGROUP.CHEST] || 0;
    const stomachHits = hitgroupCounts[HITGROUP.STOMACH] || 0;
    const armHits = (hitgroupCounts[HITGROUP.LEFT_ARM] || 0) + (hitgroupCounts[HITGROUP.RIGHT_ARM] || 0);
    const legHits = (hitgroupCounts[HITGROUP.LEFT_LEG] || 0) + (hitgroupCounts[HITGROUP.RIGHT_LEG] || 0);

    // Calculate score based on hit distribution
    // Good crosshair placement = more head/chest hits, fewer leg hits
    const headScore = (headHits / totalHits) * 100; // Up to 100 points for headshots
    const upperBodyScore = ((chestHits + stomachHits) / totalHits) * 50; // Up to 50 points
    const legPenalty = (legHits / totalHits) * 30; // Penalty for leg shots

    // Kill headshot percentage bonus
    const playerKills = kills.filter(k => k.attackerSteamId === playerSteamId);
    const killHsRate = playerKills.length > 0
      ? playerKills.filter(k => k.headshot).length / playerKills.length
      : 0;
    const hsBonus = killHsRate * 20; // Up to 20 points bonus

    const score = headScore + upperBodyScore - legPenalty + hsBonus;
    return Math.max(0, Math.min(100, score));
  }

  private estimateReactionTime(
    kills: KillEvent[],
    damages: DamageEvent[],
    positions: PositionSnapshot[],
    playerSteamId: string
  ): { average: number; best: number } {
    const reactionTimes: number[] = [];

    // Analyze time between being visible and getting a kill
    for (const kill of kills) {
      if (kill.attackerSteamId !== playerSteamId) continue;

      // Find first damage to this victim
      const firstDamage = damages.find(
        d => d.attackerSteamId === playerSteamId &&
             d.victimSteamId === kill.victimSteamId &&
             d.round === kill.round
      );

      if (firstDamage) {
        // Estimate visibility time based on positions
        const visibilityTick = this.estimateVisibilityTick(
          positions,
          playerSteamId,
          kill.victimSteamId,
          kill.round,
          firstDamage.tick
        );

        if (visibilityTick > 0 && firstDamage.tick > visibilityTick) {
          // Convert ticks to ms (assuming 128 tick)
          const reactionMs = ((firstDamage.tick - visibilityTick) / 128) * 1000;
          if (reactionMs > 50 && reactionMs < 1000) { // Reasonable range
            reactionTimes.push(reactionMs);
          }
        }
      }
    }

    // Fallback estimates based on kill patterns
    if (reactionTimes.length < 3) {
      const baseReaction = 250;
      const skillfulKills = kills.filter(k =>
        k.attackerSteamId === playerSteamId &&
        (k.throughSmoke || k.attackerBlind || k.noScope)
      );
      const quickKillRatio = skillfulKills.length / Math.max(1, kills.filter(k => k.attackerSteamId === playerSteamId).length);

      return {
        average: Math.round(Math.max(150, baseReaction - quickKillRatio * 50)),
        best: Math.round(Math.max(100, baseReaction - quickKillRatio * 50 - 70)),
      };
    }

    const sortedTimes = reactionTimes.sort((a, b) => a - b);
    const average = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const best = sortedTimes[Math.floor(sortedTimes.length * 0.1)] || sortedTimes[0]; // 10th percentile

    return {
      average: Math.round(average),
      best: Math.round(best),
    };
  }

  private estimateVisibilityTick(
    positions: PositionSnapshot[],
    _playerSteamId: string,
    _victimSteamId: string,
    _round: number,
    beforeTick: number
  ): number {
    // Simplified: estimate visibility started ~500ms before first damage
    // Real implementation would need line-of-sight calculation
    return Math.max(0, beforeTick - 64);
  }

  private calculateSprayScore(analysis: SprayAnalysis): number {
    let score = 50; // Base score

    // Bonus for headshot rate during sprays
    if (analysis.sprayKills > 0) {
      const sprayHsRate = analysis.sprayHeadshots / analysis.sprayKills;
      score += sprayHsRate * 30; // Up to 30 points
    }

    // Bonus for quick kills (low bullets to kill)
    if (analysis.avgBulletsToKill > 0) {
      const bulletBonus = Math.max(0, 20 - (analysis.avgBulletsToKill - 3) * 5);
      score += bulletBonus;
    }

    // Bonus for successful transfers
    if (analysis.sprayTransfers > 0) {
      const transferRate = analysis.successfulTransfers / analysis.sprayTransfers;
      score += transferRate * 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateOverallAccuracy(damages: DamageEvent[], playerSteamId: string): number {
    const playerDamages = damages.filter(d => d.attackerSteamId === playerSteamId);
    if (playerDamages.length === 0) return 0.25;

    // Calculate hit distribution quality
    const headHits = playerDamages.filter(d => d.hitgroup === HITGROUP.HEAD).length;
    const bodyHits = playerDamages.filter(d =>
      d.hitgroup === HITGROUP.CHEST || d.hitgroup === HITGROUP.STOMACH
    ).length;
    const totalHits = playerDamages.length;

    // Weight: head > body > limbs
    const weightedScore = (headHits * 1.5 + bodyHits * 1.0 + (totalHits - headHits - bodyHits) * 0.5) / (totalHits * 1.5);

    return Math.min(1, weightedScore);
  }
}