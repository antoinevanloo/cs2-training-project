import { ParsedDemoData, KillEvent } from './types';

/**
 * Extract player statistics from parsed demo data
 */
export function extractPlayerStats(
  data: ParsedDemoData,
  steamId: string
): {
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  totalDamage: number;
  weaponStats: Record<string, { kills: number; headshots: number; damage: number }>;
} {
  const playerKills = data.kills.filter((k) => k.attackerSteamId === steamId);
  const playerDeaths = data.kills.filter((k) => k.victimSteamId === steamId);
  const playerDamages = data.damages.filter((d) => d.attackerSteamId === steamId);

  // Calculate assists (damage to victims killed by teammates within 5 seconds)
  const assists = calculateAssists(data, steamId);

  // Calculate weapon stats
  const weaponStats: Record<string, { kills: number; headshots: number; damage: number }> = {};

  for (const kill of playerKills) {
    const weapon = normalizeWeaponName(kill.weapon);
    if (!weaponStats[weapon]) {
      weaponStats[weapon] = { kills: 0, headshots: 0, damage: 0 };
    }
    weaponStats[weapon].kills++;
    if (kill.headshot) {
      weaponStats[weapon].headshots++;
    }
  }

  for (const damage of playerDamages) {
    const weapon = normalizeWeaponName(damage.weapon);
    if (!weaponStats[weapon]) {
      weaponStats[weapon] = { kills: 0, headshots: 0, damage: 0 };
    }
    weaponStats[weapon].damage += damage.damage;
  }

  return {
    kills: playerKills.length,
    deaths: playerDeaths.length,
    assists,
    headshots: playerKills.filter((k) => k.headshot).length,
    totalDamage: playerDamages.reduce((sum, d) => sum + d.damage, 0),
    weaponStats,
  };
}

/**
 * Calculate assists for a player
 */
function calculateAssists(data: ParsedDemoData, steamId: string): number {
  let assists = 0;
  const tickrate = data.metadata.tickrate || 64;
  const assistWindow = tickrate * 5; // 5 seconds

  for (const kill of data.kills) {
    if (kill.attackerSteamId === steamId) continue;

    // Check if player damaged the victim recently
    const recentDamage = data.damages.find(
      (d) =>
        d.attackerSteamId === steamId &&
        d.victimSteamId === kill.victimSteamId &&
        d.round === kill.round &&
        kill.tick - d.tick < assistWindow &&
        kill.tick - d.tick >= 0
    );

    if (recentDamage) {
      assists++;
    }
  }

  return assists;
}

/**
 * Normalize weapon names
 */
function normalizeWeaponName(weapon: string): string {
  const normalizations: Record<string, string> = {
    ak47: 'AK-47',
    m4a1: 'M4A1-S',
    m4a1_silencer: 'M4A1-S',
    m4a4: 'M4A4',
    awp: 'AWP',
    deagle: 'Desert Eagle',
    usp_silencer: 'USP-S',
    glock: 'Glock-18',
    p250: 'P250',
    fiveseven: 'Five-SeveN',
    tec9: 'Tec-9',
    cz75a: 'CZ75-Auto',
    sg556: 'SG 553',
    aug: 'AUG',
    famas: 'FAMAS',
    galil: 'Galil AR',
    ssg08: 'SSG 08',
    scar20: 'SCAR-20',
    g3sg1: 'G3SG1',
    mac10: 'MAC-10',
    mp9: 'MP9',
    mp7: 'MP7',
    mp5sd: 'MP5-SD',
    ump45: 'UMP-45',
    p90: 'P90',
    bizon: 'PP-Bizon',
    nova: 'Nova',
    xm1014: 'XM1014',
    sawedoff: 'Sawed-Off',
    mag7: 'MAG-7',
    m249: 'M249',
    negev: 'Negev',
    hegrenade: 'HE Grenade',
    flashbang: 'Flashbang',
    smokegrenade: 'Smoke',
    molotov: 'Molotov',
    incgrenade: 'Incendiary',
    decoy: 'Decoy',
    knife: 'Knife',
    knife_t: 'Knife',
    knife_default_ct: 'Knife',
    knife_default_t: 'Knife',
    inferno: 'Fire',
  };

  const lower = weapon.toLowerCase().replace('weapon_', '');
  return normalizations[lower] || weapon;
}

/**
 * Calculate entry kill statistics
 */
export function calculateEntryStats(
  data: ParsedDemoData,
  steamId: string
): { entryKills: number; entryDeaths: number } {
  let entryKills = 0;
  let entryDeaths = 0;

  // Group kills by round
  const killsByRound: Record<number, KillEvent[]> = {};
  for (const kill of data.kills) {
    if (!killsByRound[kill.round]) {
      killsByRound[kill.round] = [];
    }
    killsByRound[kill.round].push(kill);
  }

  // Find first kill of each round
  for (const round in killsByRound) {
    const roundKills = killsByRound[round].sort((a, b) => a.tick - b.tick);
    if (roundKills.length > 0) {
      const firstKill = roundKills[0];
      if (firstKill.attackerSteamId === steamId) {
        entryKills++;
      }
      if (firstKill.victimSteamId === steamId) {
        entryDeaths++;
      }
    }
  }

  return { entryKills, entryDeaths };
}

/**
 * Calculate clutch statistics
 */
export function calculateClutchStats(
  _data: ParsedDemoData,
  _steamId: string,
  _playerTeam: number
): { clutchesWon: number; clutchesLost: number } {
  // This would require more detailed round state tracking
  // Simplified implementation
  return { clutchesWon: 0, clutchesLost: 0 };
}

/**
 * Calculate flash assist statistics
 */
export function calculateFlashStats(
  data: ParsedDemoData,
  steamId: string
): { flashAssists: number; enemiesFlashed: number } {
  const playerFlashes = data.grenades.filter(
    (g) => g.type === 'flash' && g.throwerSteamId === steamId
  );

  // Simplified - would need blindness events for accurate count
  return {
    flashAssists: 0,
    enemiesFlashed: playerFlashes.length * 2, // Estimate
  };
}

/**
 * Get player team from demo data
 */
export function getPlayerTeam(data: ParsedDemoData, steamId: string): number {
  const player = data.players.find((p) => p.steamId === steamId);
  return player?.team || 1;
}

/**
 * Determine match result for a player
 */
export function determineMatchResult(
  data: ParsedDemoData,
  playerTeam: number
): { scoreTeam1: number; scoreTeam2: number; result: 'WIN' | 'LOSS' | 'TIE' } {
  // Team 2 = CT side at start, Team 3 = T side at start
  const team1Wins = data.rounds.filter((r) => r.winner === 2).length;
  const team2Wins = data.rounds.filter((r) => r.winner === 3).length;

  const isTeam1 = playerTeam === 2;
  const playerWins = isTeam1 ? team1Wins : team2Wins;
  const opponentWins = isTeam1 ? team2Wins : team1Wins;

  let result: 'WIN' | 'LOSS' | 'TIE' = 'TIE';
  if (playerWins > opponentWins) result = 'WIN';
  else if (opponentWins > playerWins) result = 'LOSS';

  return {
    scoreTeam1: playerWins,
    scoreTeam2: opponentWins,
    result,
  };
}
