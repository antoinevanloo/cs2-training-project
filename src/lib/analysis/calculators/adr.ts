import { DamageEvent } from '@/lib/demo-parser/types';

/**
 * Calculate Average Damage per Round
 */
export function calculateADR(damages: DamageEvent[], totalRounds: number): number {
  if (totalRounds === 0) return 0;

  const totalDamage = damages.reduce((sum, d) => sum + d.damage, 0);
  return totalDamage / totalRounds;
}

/**
 * Calculate damage per round by weapon type
 */
export function calculateADRByWeapon(
  damages: DamageEvent[],
  totalRounds: number
): Record<string, number> {
  if (totalRounds === 0) return {};

  const damageByWeapon: Record<string, number> = {};

  for (const damage of damages) {
    const weapon = damage.weapon;
    if (!damageByWeapon[weapon]) {
      damageByWeapon[weapon] = 0;
    }
    damageByWeapon[weapon] += damage.damage;
  }

  // Convert to per-round
  const adrByWeapon: Record<string, number> = {};
  for (const [weapon, totalDamage] of Object.entries(damageByWeapon)) {
    adrByWeapon[weapon] = totalDamage / totalRounds;
  }

  return adrByWeapon;
}

/**
 * Calculate damage effectiveness (damage dealt vs taken)
 */
export function calculateDamageEffectiveness(
  damageDealt: DamageEvent[],
  damageTaken: DamageEvent[]
): number {
  const totalDealt = damageDealt.reduce((sum, d) => sum + d.damage, 0);
  const totalTaken = damageTaken.reduce((sum, d) => sum + d.damage, 0);

  if (totalTaken === 0) return totalDealt > 0 ? 2.0 : 1.0;

  return totalDealt / totalTaken;
}
