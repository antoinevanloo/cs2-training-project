import { GrenadeEvent, DamageEvent, KillEvent, Position3D } from '@/lib/demo-parser/types';
import { UtilityAnalysis } from '../types';

interface FlashAnalysis {
  thrown: number;
  enemiesFlashed: number;
  flashAssists: number;
  selfFlashes: number;
  teamFlashes: number;
  effectiveness: number;
  flashKillTime: number[]; // Time between flash and kill
}

interface SmokeAnalysis {
  thrown: number;
  usedForExecute: number;
  usedDefensively: number;
  oneWaySmokes: number;
  avgTimingBeforeKill: number; // How long before a kill was the smoke thrown
}

interface MolotovAnalysis {
  thrown: number;
  totalDamage: number;
  avgDamagePerMolly: number;
  killsFromMolly: number;
  denialMollies: number; // Mollies thrown in common push spots
}

interface HEAnalysis {
  thrown: number;
  totalDamage: number;
  avgDamagePerHE: number;
  killsFromHE: number;
  multiHits: number; // HE that hit 2+ enemies
}

interface UtilityTiming {
  preExecuteUtility: number;
  reactiveUtility: number;
  wastedUtility: number;
}

// Common positions for denial mollies on competitive maps
const DENIAL_POSITIONS: Record<string, Position3D[]> = {
  de_dust2: [
    { x: -1200, y: 2600, z: 0 }, // B tunnels
    { x: 1200, y: 1400, z: 0 }, // Long doors
    { x: 200, y: 2200, z: 0 }, // Short
  ],
  de_mirage: [
    { x: -2200, y: -200, z: 0 }, // B apps
    { x: -400, y: 200, z: 0 }, // Mid window
    { x: 800, y: -1400, z: 0 }, // Palace
  ],
  de_inferno: [
    { x: 400, y: 2400, z: 0 }, // Banana
    { x: 2200, y: 0, z: 0 }, // Apps
    { x: 600, y: 1600, z: 0 }, // Mid
  ],
};

export class UtilityAnalyzer {
  analyze(
    grenades: GrenadeEvent[],
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): UtilityAnalysis {
    // Filter player's grenades
    const playerGrenades = grenades.filter(g => g.throwerSteamId === playerSteamId);

    // Count grenades by type
    const flashes = playerGrenades.filter((g) => g.type === 'flash');
    const smokes = playerGrenades.filter((g) => g.type === 'smoke');
    const molotovs = playerGrenades.filter((g) => g.type === 'molotov');
    const heGrenades = playerGrenades.filter((g) => g.type === 'he');

    // Detailed flash analysis
    const flashAnalysis = this.analyzeFlashes(flashes, kills, playerSteamId);

    // Detailed smoke analysis
    const smokeAnalysis = this.analyzeSmokes(smokes, kills, playerSteamId);

    // Detailed molotov analysis
    const molotovAnalysis = this.analyzeMolotovs(molotovs, damages, kills, playerSteamId);

    // Detailed HE analysis
    const heAnalysis = this.analyzeHE(heGrenades, damages, kills, playerSteamId);

    // Utility timing analysis
    const timingAnalysis = this.analyzeUtilityTiming(playerGrenades, kills, playerSteamId);

    // Calculate overall utility score
    const utilityScore = this.calculateUtilityScore(
      flashAnalysis,
      smokeAnalysis,
      molotovAnalysis,
      heAnalysis,
      timingAnalysis
    );

    return {
      flashEfficiency: {
        thrown: flashAnalysis.thrown,
        enemiesFlashed: flashAnalysis.enemiesFlashed,
        effectiveness: flashAnalysis.effectiveness,
      },
      smokeUsage: {
        thrown: smokeAnalysis.thrown,
        usedForExecute: smokeAnalysis.usedForExecute,
      },
      molotovDamage: {
        thrown: molotovAnalysis.thrown,
        totalDamage: molotovAnalysis.totalDamage,
      },
      heUsage: {
        thrown: heAnalysis.thrown,
        totalDamage: heAnalysis.totalDamage,
      },
      metrics: {
        flashEfficiency: flashAnalysis.effectiveness * 100,
        smokePlacement: smokeAnalysis.thrown > 0
          ? Math.min(100, 50 + (smokeAnalysis.usedForExecute / smokeAnalysis.thrown) * 50)
          : 40,
        molotovUsage: molotovAnalysis.thrown > 0
          ? Math.min(100, 40 + molotovAnalysis.avgDamagePerMolly + molotovAnalysis.denialMollies * 5)
          : 40,
        heEfficiency: heAnalysis.thrown > 0
          ? Math.min(100, 30 + heAnalysis.avgDamagePerHE + heAnalysis.multiHits * 10)
          : 40,
        overall: utilityScore,
        // Additional detailed metrics
        flashAssists: flashAnalysis.flashAssists,
        selfFlashes: flashAnalysis.selfFlashes,
        teamFlashes: flashAnalysis.teamFlashes,
        avgFlashToKillTime: flashAnalysis.flashKillTime.length > 0
          ? flashAnalysis.flashKillTime.reduce((a, b) => a + b, 0) / flashAnalysis.flashKillTime.length
          : 0,
        defensiveSmokes: smokeAnalysis.usedDefensively,
        avgMollyDamage: molotovAnalysis.avgDamagePerMolly,
        heMultiHits: heAnalysis.multiHits,
        preExecuteUtility: timingAnalysis.preExecuteUtility,
        wastedUtility: timingAnalysis.wastedUtility,
      },
    };
  }

  private analyzeFlashes(
    flashes: GrenadeEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): FlashAnalysis {
    const analysis: FlashAnalysis = {
      thrown: flashes.length,
      enemiesFlashed: 0,
      flashAssists: 0,
      selfFlashes: 0,
      teamFlashes: 0,
      effectiveness: 0,
      flashKillTime: [],
    };

    if (flashes.length === 0) return analysis;

    const playerKills = kills.filter(k => k.attackerSteamId === playerSteamId);

    // Analyze each flash
    for (const flash of flashes) {
      // Find kills that happened shortly after this flash (within 3 seconds = ~384 ticks)
      const killsAfterFlash = playerKills.filter(
        k => k.round === flash.round &&
             k.tick > flash.tick &&
             k.tick < flash.tick + 384
      );

      if (killsAfterFlash.length > 0) {
        analysis.flashAssists += killsAfterFlash.length;
        analysis.enemiesFlashed += killsAfterFlash.length;

        for (const kill of killsAfterFlash) {
          analysis.flashKillTime.push((kill.tick - flash.tick) / 128 * 1000); // Convert to ms
        }
      }

      // Check for self flash (player dies shortly after throwing)
      const playerDeathAfterFlash = kills.find(
        k => k.victimSteamId === playerSteamId &&
             k.round === flash.round &&
             k.tick > flash.tick &&
             k.tick < flash.tick + 128 && // Within 1 second
             k.attackerBlind === false // Player wasn't the one blinding the attacker
      );

      if (playerDeathAfterFlash) {
        analysis.selfFlashes++;
      }
    }

    // Estimate effectiveness based on flash assists and thrown count
    // Good players get approximately 1 kill per 2-3 flashes
    const assistRatio = analysis.flashAssists / analysis.thrown;
    analysis.effectiveness = Math.min(1, assistRatio * 2);

    // Penalty for self flashes
    if (analysis.selfFlashes > 0) {
      analysis.effectiveness *= (1 - (analysis.selfFlashes / analysis.thrown) * 0.3);
    }

    return analysis;
  }

  private analyzeSmokes(
    smokes: GrenadeEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): SmokeAnalysis {
    const analysis: SmokeAnalysis = {
      thrown: smokes.length,
      usedForExecute: 0,
      usedDefensively: 0,
      oneWaySmokes: 0,
      avgTimingBeforeKill: 0,
    };

    if (smokes.length === 0) return analysis;

    const playerKills = kills.filter(k => k.attackerSteamId === playerSteamId);
    const timingsBeforeKill: number[] = [];

    for (const smoke of smokes) {
      // Find kills that happened while smoke is active (~18 seconds = ~2304 ticks at 128)
      const killsDuringSmoke = playerKills.filter(
        k => k.round === smoke.round &&
             k.tick > smoke.tick &&
             k.tick < smoke.tick + 2304
      );

      if (killsDuringSmoke.length > 0) {
        analysis.usedForExecute++;

        for (const kill of killsDuringSmoke) {
          timingsBeforeKill.push((kill.tick - smoke.tick) / 128); // seconds
        }

        // Check for one-way smokes (kill through smoke shortly after placement)
        const earlyKillsThroughSmoke = killsDuringSmoke.filter(
          k => k.throughSmoke && k.tick < smoke.tick + 640 // Within 5 seconds
        );
        if (earlyKillsThroughSmoke.length > 0) {
          analysis.oneWaySmokes++;
        }
      }

      // Defensive smoke: thrown when player is being attacked
      const playerDeathNearSmoke = kills.find(
        k => k.victimSteamId === playerSteamId &&
             k.round === smoke.round &&
             Math.abs(k.tick - smoke.tick) < 256 // Within 2 seconds
      );

      if (playerDeathNearSmoke) {
        analysis.usedDefensively++;
      }
    }

    if (timingsBeforeKill.length > 0) {
      analysis.avgTimingBeforeKill = timingsBeforeKill.reduce((a, b) => a + b, 0) / timingsBeforeKill.length;
    }

    return analysis;
  }

  private analyzeMolotovs(
    molotovs: GrenadeEvent[],
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): MolotovAnalysis {
    const analysis: MolotovAnalysis = {
      thrown: molotovs.length,
      totalDamage: 0,
      avgDamagePerMolly: 0,
      killsFromMolly: 0,
      denialMollies: 0,
    };

    if (molotovs.length === 0) return analysis;

    // Calculate total molotov damage
    const molotovDamages = damages.filter(
      d => d.attackerSteamId === playerSteamId &&
           (d.weapon === 'inferno' || d.weapon === 'molotov' || d.weapon === 'weapon_molotov')
    );

    analysis.totalDamage = molotovDamages.reduce((sum, d) => sum + d.damage, 0);
    analysis.avgDamagePerMolly = molotovs.length > 0 ? analysis.totalDamage / molotovs.length : 0;

    // Count molotov kills
    const molotovKills = kills.filter(
      k => k.attackerSteamId === playerSteamId &&
           (k.weapon === 'inferno' || k.weapon === 'molotov')
    );
    analysis.killsFromMolly = molotovKills.length;

    // Check for denial mollies (thrown in common push spots)
    for (const molotov of molotovs) {
      const mapDenialPositions = DENIAL_POSITIONS[molotov.position.x.toString().split('/').pop() || ''] || [];

      for (const denialPos of mapDenialPositions) {
        const distance = Math.sqrt(
          Math.pow(molotov.position.x - denialPos.x, 2) +
          Math.pow(molotov.position.y - denialPos.y, 2)
        );

        if (distance < 300) { // Within 300 units of denial position
          analysis.denialMollies++;
          break;
        }
      }
    }

    return analysis;
  }

  private analyzeHE(
    heGrenades: GrenadeEvent[],
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): HEAnalysis {
    const analysis: HEAnalysis = {
      thrown: heGrenades.length,
      totalDamage: 0,
      avgDamagePerHE: 0,
      killsFromHE: 0,
      multiHits: 0,
    };

    if (heGrenades.length === 0) return analysis;

    // Calculate HE damage
    const heDamages = damages.filter(
      d => d.attackerSteamId === playerSteamId &&
           (d.weapon === 'hegrenade' || d.weapon === 'weapon_hegrenade')
    );

    analysis.totalDamage = heDamages.reduce((sum, d) => sum + d.damage, 0);
    analysis.avgDamagePerHE = heGrenades.length > 0 ? analysis.totalDamage / heGrenades.length : 0;

    // Count HE kills
    const heKills = kills.filter(
      k => k.attackerSteamId === playerSteamId &&
           (k.weapon === 'hegrenade' || k.weapon === 'weapon_hegrenade')
    );
    analysis.killsFromHE = heKills.length;

    // Check for multi-hits (group damages by approximate tick)
    const damagesByRound: Record<number, DamageEvent[]> = {};
    for (const damage of heDamages) {
      if (!damagesByRound[damage.round]) {
        damagesByRound[damage.round] = [];
      }
      damagesByRound[damage.round].push(damage);
    }

    for (const round in damagesByRound) {
      const roundDamages = damagesByRound[round].sort((a, b) => a.tick - b.tick);

      // Group by tick proximity (same HE explosion = ~10 tick window)
      let currentGroup: DamageEvent[] = [];
      let lastTick = 0;

      for (const damage of roundDamages) {
        if (damage.tick - lastTick > 10 && currentGroup.length > 0) {
          // Check if multiple victims
          const victims = new Set(currentGroup.map(d => d.victimSteamId));
          if (victims.size >= 2) {
            analysis.multiHits++;
          }
          currentGroup = [];
        }

        currentGroup.push(damage);
        lastTick = damage.tick;
      }

      // Check last group
      if (currentGroup.length > 0) {
        const victims = new Set(currentGroup.map(d => d.victimSteamId));
        if (victims.size >= 2) {
          analysis.multiHits++;
        }
      }
    }

    return analysis;
  }

  private analyzeUtilityTiming(
    grenades: GrenadeEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): UtilityTiming {
    const timing: UtilityTiming = {
      preExecuteUtility: 0,
      reactiveUtility: 0,
      wastedUtility: 0,
    };

    if (grenades.length === 0) return timing;

    const playerKills = kills.filter(k => k.attackerSteamId === playerSteamId);

    for (const grenade of grenades) {
      // Check if utility led to a kill (within 5 seconds)
      const killAfterUtility = playerKills.find(
        k => k.round === grenade.round &&
             k.tick > grenade.tick &&
             k.tick < grenade.tick + 640
      );

      if (killAfterUtility) {
        // Pre-execute: utility thrown 2+ seconds before kill
        if (killAfterUtility.tick - grenade.tick > 256) {
          timing.preExecuteUtility++;
        } else {
          // Reactive: utility thrown just before kill
          timing.reactiveUtility++;
        }
      } else {
        // No kill after utility - check if it was completely wasted
        const anyKillInRound = playerKills.find(k => k.round === grenade.round);
        if (!anyKillInRound) {
          timing.wastedUtility++;
        }
      }
    }

    return timing;
  }

  private calculateUtilityScore(
    flash: FlashAnalysis,
    smoke: SmokeAnalysis,
    molotov: MolotovAnalysis,
    he: HEAnalysis,
    timing: UtilityTiming
  ): number {
    let score = 40; // Base score

    // Flash score (max +25)
    if (flash.thrown > 0) {
      const flashScore = flash.effectiveness * 15;
      const assistBonus = Math.min(10, flash.flashAssists * 2);
      const selfFlashPenalty = flash.selfFlashes * 2;
      score += Math.max(0, flashScore + assistBonus - selfFlashPenalty);
    }

    // Smoke score (max +15)
    if (smoke.thrown > 0) {
      const executeRate = smoke.usedForExecute / smoke.thrown;
      score += executeRate * 10;
      score += Math.min(5, smoke.oneWaySmokes * 2);
    }

    // Molotov score (max +15)
    if (molotov.thrown > 0) {
      const avgDamageScore = Math.min(10, molotov.avgDamagePerMolly / 5);
      const denialBonus = Math.min(5, molotov.denialMollies);
      score += avgDamageScore + denialBonus;
    }

    // HE score (max +10)
    if (he.thrown > 0) {
      const avgDamageScore = Math.min(5, he.avgDamagePerHE / 10);
      const multiHitBonus = Math.min(5, he.multiHits * 2);
      score += avgDamageScore + multiHitBonus;
    }

    // Timing bonus/penalty (±10)
    const totalUtility = flash.thrown + smoke.thrown + molotov.thrown + he.thrown;
    if (totalUtility > 0) {
      const preExecuteRate = timing.preExecuteUtility / totalUtility;
      const wastedRate = timing.wastedUtility / totalUtility;
      score += preExecuteRate * 10;
      score -= wastedRate * 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
