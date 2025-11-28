import { GrenadeEvent, DamageEvent, KillEvent } from '@/lib/demo-parser/types';
import { UtilityAnalysis } from '../types';

export class UtilityAnalyzer {
  analyze(
    grenades: GrenadeEvent[],
    damages: DamageEvent[],
    kills: KillEvent[],
    playerSteamId: string
  ): UtilityAnalysis {
    // Count grenades by type
    const flashes = grenades.filter((g) => g.type === 'flash');
    const smokes = grenades.filter((g) => g.type === 'smoke');
    const molotovs = grenades.filter((g) => g.type === 'molotov');
    const heGrenades = grenades.filter((g) => g.type === 'he');

    // Calculate HE and molotov damage
    const heDamage = damages
      .filter((d) => d.weapon === 'hegrenade' || d.weapon === 'weapon_hegrenade')
      .reduce((sum, d) => sum + d.damage, 0);

    const molotovDamage = damages
      .filter(
        (d) =>
          d.weapon === 'inferno' ||
          d.weapon === 'molotov' ||
          d.weapon === 'weapon_molotov'
      )
      .reduce((sum, d) => sum + d.damage, 0);

    // Estimate flash effectiveness
    const flashEffectiveness = this.calculateFlashEffectiveness(
      flashes.length,
      kills.length
    );

    // Calculate utility score
    const utilityScore = this.calculateUtilityScore(
      flashes.length,
      flashEffectiveness,
      smokes.length,
      molotovs.length,
      molotovDamage,
      heGrenades.length,
      heDamage
    );

    return {
      flashEfficiency: {
        thrown: flashes.length,
        enemiesFlashed: Math.round(flashes.length * flashEffectiveness * 2),
        effectiveness: flashEffectiveness,
      },
      smokeUsage: {
        thrown: smokes.length,
        usedForExecute: Math.round(smokes.length * 0.7), // Estimate
      },
      molotovDamage: {
        thrown: molotovs.length,
        totalDamage: molotovDamage,
      },
      heUsage: {
        thrown: heGrenades.length,
        totalDamage: heDamage,
      },
      metrics: {
        flashEfficiency: flashEffectiveness * 100,
        smokePlacement: smokes.length > 0 ? 70 : 40, // Base score
        molotovUsage:
          molotovs.length > 0
            ? Math.min(100, 50 + molotovDamage / molotovs.length)
            : 40,
        heEfficiency:
          heGrenades.length > 0
            ? Math.min(100, 40 + heDamage / heGrenades.length)
            : 40,
        overall: utilityScore,
      },
    };
  }

  private calculateFlashEffectiveness(flashCount: number, killCount: number): number {
    if (flashCount === 0) return 0;

    // Estimate effectiveness based on kill count relative to flashes
    // Good players get roughly 1 kill per 2-3 flashes thrown
    const ratio = killCount / flashCount;
    const effectiveness = Math.min(1, ratio * 2);

    return effectiveness;
  }

  private calculateUtilityScore(
    flashCount: number,
    flashEffectiveness: number,
    smokeCount: number,
    molotovCount: number,
    molotovDamage: number,
    heCount: number,
    heDamage: number
  ): number {
    let score = 50; // Base score

    // Flash score (max +20)
    if (flashCount > 0) {
      score += Math.min(20, flashCount * 2 + flashEffectiveness * 10);
    }

    // Smoke score (max +15)
    score += Math.min(15, smokeCount * 3);

    // Molotov score (max +10)
    if (molotovCount > 0) {
      const avgMollyDamage = molotovDamage / molotovCount;
      score += Math.min(10, avgMollyDamage / 10);
    }

    // HE score (max +5)
    if (heCount > 0) {
      const avgHeDamage = heDamage / heCount;
      score += Math.min(5, avgHeDamage / 20);
    }

    return Math.min(100, Math.round(score));
  }
}
