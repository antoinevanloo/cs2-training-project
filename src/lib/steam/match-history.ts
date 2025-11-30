/**
 * Steam CS2 Match History API
 *
 * Utilise l'API Steam pour récupérer l'historique des matchs CS2
 * via le Match History Authentication Code.
 *
 * Documentation :
 * - L'API retourne les 8 derniers matchs maximum
 * - Les démos expirent après ~14 jours sur les serveurs Steam
 * - Nécessite STEAM_API_KEY dans les variables d'environnement
 */

const STEAM_API_URL = 'https://api.steampowered.com';

// Types pour les réponses de l'API Steam
export interface SteamMatchInfo {
  matchid: string;
  matchtime: number; // Unix timestamp
  watchablematchinfo: {
    tv_port: number;
    server_id: string;
    cl_decryptdata_key: string;
    cl_decryptdata_key_pub: string;
    game_type: number;
  };
  roundstatsall: Array<{
    reservationid: string;
    reservation: {
      account_ids: number[];
      pre_match_data: string;
    };
    map: string;
    round: number;
    kills: number[];
    assists: number[];
    deaths: number[];
    scores: number[];
    enemy_kills: number[];
    enemy_headshots: number[];
    mvps: number[];
    match_duration: number;
    team_scores: number[];
  }>;
}

export interface MatchHistoryMatch {
  matchId: string;
  matchTime: Date;
  map: string;
  gameMode: 'competitive' | 'premier' | 'wingman';
  score: {
    team1: number;
    team2: number;
  };
  duration: number; // seconds
  demoUrl: string | null;
  sharecode: string;
}

export interface MatchHistoryResponse {
  success: boolean;
  matches: MatchHistoryMatch[];
  nextCode: string | null; // Pour pagination
  error?: string;
}

/**
 * Decode un match share code en ses composants
 * Format: CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
 */
export function decodeShareCode(shareCode: string): {
  matchId: bigint;
  outcomeId: bigint;
  tokenId: number;
} | null {
  try {
    // Supprimer le préfixe CSGO- si présent
    const code = shareCode.replace(/^CSGO-/i, '').replace(/-/g, '');

    // Alphabet utilisé par Steam pour les share codes
    const alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';

    // Décoder en BigInt
    let total = BigInt(0);
    for (let i = code.length - 1; i >= 0; i--) {
      const charIndex = alphabet.indexOf(code[i]);
      if (charIndex === -1) return null;
      total = total * BigInt(alphabet.length) + BigInt(charIndex);
    }

    // Extraire les composants (inversé par rapport à l'encodage Steam)
    // Les bits sont répartis : matchId (low), outcomeId, tokenId
    const bytes = [];
    for (let i = 0; i < 18; i++) {
      bytes.push(Number(total & BigInt(0xff)));
      total = total >> BigInt(8);
    }
    bytes.reverse();

    // Réassembler les valeurs
    // Note: L'ordre exact dépend de l'implémentation Steam
    const matchId =
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << BigInt(8)) |
      (BigInt(bytes[2]) << BigInt(16)) |
      (BigInt(bytes[3]) << BigInt(24)) |
      (BigInt(bytes[4]) << BigInt(32)) |
      (BigInt(bytes[5]) << BigInt(40)) |
      (BigInt(bytes[6]) << BigInt(48)) |
      (BigInt(bytes[7]) << BigInt(56));

    const outcomeId =
      BigInt(bytes[8]) |
      (BigInt(bytes[9]) << BigInt(8)) |
      (BigInt(bytes[10]) << BigInt(16)) |
      (BigInt(bytes[11]) << BigInt(24)) |
      (BigInt(bytes[12]) << BigInt(32)) |
      (BigInt(bytes[13]) << BigInt(40)) |
      (BigInt(bytes[14]) << BigInt(48)) |
      (BigInt(bytes[15]) << BigInt(56));

    const tokenId = (bytes[16] << 8) | bytes[17];

    return { matchId, outcomeId, tokenId };
  } catch {
    return null;
  }
}

/**
 * Encode les composants en share code
 */
export function encodeShareCode(
  matchId: bigint,
  outcomeId: bigint,
  tokenId: number
): string {
  const alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';

  // Combiner en bytes
  const bytes = new Uint8Array(18);

  // MatchId (8 bytes)
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((matchId >> BigInt(i * 8)) & BigInt(0xff));
  }

  // OutcomeId (8 bytes)
  for (let i = 0; i < 8; i++) {
    bytes[8 + i] = Number((outcomeId >> BigInt(i * 8)) & BigInt(0xff));
  }

  // TokenId (2 bytes)
  bytes[16] = (tokenId >> 8) & 0xff;
  bytes[17] = tokenId & 0xff;

  // Combiner en BigInt
  let total = BigInt(0);
  for (let i = bytes.length - 1; i >= 0; i--) {
    total = (total << BigInt(8)) | BigInt(bytes[i]);
  }

  // Encoder en share code
  let code = '';
  for (let i = 0; i < 25; i++) {
    code = alphabet[Number(total % BigInt(alphabet.length))] + code;
    total = total / BigInt(alphabet.length);
  }

  // Formater avec tirets : CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
  return `CSGO-${code.slice(0, 5)}-${code.slice(5, 10)}-${code.slice(10, 15)}-${code.slice(15, 20)}-${code.slice(20, 25)}`;
}

/**
 * Récupère l'historique des matchs via l'API Steam
 *
 * Note: Cette API nécessite que l'utilisateur ait généré un
 * Match History Authentication Code dans CS2.
 */
export async function getMatchHistory(
  steamId: string,
  authCode: string,
  lastKnownCode?: string
): Promise<MatchHistoryResponse> {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      matches: [],
      nextCode: null,
      error: 'STEAM_API_KEY non configurée',
    };
  }

  try {
    // L'API Steam pour les matchs CS2 nécessite d'appeler
    // GetNextMatchSharingCode en boucle

    const params = new URLSearchParams({
      key: apiKey,
      steamid: steamId,
      steamidkey: authCode,
    });

    if (lastKnownCode) {
      params.append('knowncode', lastKnownCode);
    }

    const response = await fetch(
      `${STEAM_API_URL}/ICSGOPlayers_730/GetNextMatchSharingCode/v1?${params}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Steam API error:', response.status, errorText);

      if (response.status === 403) {
        return {
          success: false,
          matches: [],
          nextCode: null,
          error: 'Code d\'authentification invalide ou expiré',
        };
      }

      return {
        success: false,
        matches: [],
        nextCode: null,
        error: `Erreur Steam API: ${response.status}`,
      };
    }

    const data = await response.json();

    // L'API retourne le prochain share code disponible
    // Si result.nextcode === "n/a", il n'y a plus de matchs
    if (data.result?.nextcode === 'n/a' || !data.result?.nextcode) {
      return {
        success: true,
        matches: [],
        nextCode: null,
      };
    }

    // Récupérer les détails du match avec le share code
    const shareCode = data.result.nextcode;
    const matchDetails = await getMatchDetails(shareCode);

    if (!matchDetails) {
      return {
        success: true,
        matches: [],
        nextCode: shareCode,
      };
    }

    return {
      success: true,
      matches: [matchDetails],
      nextCode: shareCode,
    };
  } catch (error) {
    console.error('Error fetching match history:', error);
    return {
      success: false,
      matches: [],
      nextCode: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les détails d'un match à partir de son share code
 */
export async function getMatchDetails(
  shareCode: string
): Promise<MatchHistoryMatch | null> {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    console.error('STEAM_API_KEY not configured');
    return null;
  }

  try {
    // Décoder le share code
    const decoded = decodeShareCode(shareCode);
    if (!decoded) {
      console.error('Invalid share code:', shareCode);
      return null;
    }

    // Appeler l'API pour obtenir les détails
    const params = new URLSearchParams({
      key: apiKey,
      matchid: decoded.matchId.toString(),
      outcomeid: decoded.outcomeId.toString(),
      token: decoded.tokenId.toString(),
    });

    const response = await fetch(
      `${STEAM_API_URL}/ICSGOPlayers_730/GetMatchInfo/v1?${params}`
    );

    if (!response.ok) {
      console.error('Failed to get match details:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.result || data.result.error) {
      console.error('Match not found or expired');
      return null;
    }

    const matchInfo = data.result as SteamMatchInfo;
    const roundStats = matchInfo.roundstatsall?.[matchInfo.roundstatsall.length - 1];

    // Déterminer le mode de jeu
    let gameMode: 'competitive' | 'premier' | 'wingman' = 'competitive';
    if (matchInfo.watchablematchinfo?.game_type === 8) {
      gameMode = 'wingman';
    } else if (matchInfo.watchablematchinfo?.game_type === 12) {
      gameMode = 'premier';
    }

    // Construire l'URL de téléchargement de la démo
    let demoUrl: string | null = null;
    if (matchInfo.watchablematchinfo?.server_id) {
      demoUrl = `http://replay${matchInfo.watchablematchinfo.server_id.slice(-1)}.valve.net/730/${matchInfo.matchid}_${matchInfo.watchablematchinfo.server_id}.dem.bz2`;
    }

    return {
      matchId: matchInfo.matchid,
      matchTime: new Date(matchInfo.matchtime * 1000),
      map: roundStats?.map || 'unknown',
      gameMode,
      score: {
        team1: roundStats?.team_scores?.[0] || 0,
        team2: roundStats?.team_scores?.[1] || 0,
      },
      duration: roundStats?.match_duration || 0,
      demoUrl,
      sharecode: shareCode,
    };
  } catch (error) {
    console.error('Error getting match details:', error);
    return null;
  }
}

/**
 * Récupère tous les matchs disponibles (jusqu'à 8)
 * en appelant getNextMatchSharingCode en boucle
 */
export async function getAllRecentMatches(
  steamId: string,
  authCode: string,
  startFromCode?: string
): Promise<MatchHistoryResponse> {
  const allMatches: MatchHistoryMatch[] = [];
  let currentCode = startFromCode;
  let lastCode: string | null = null;
  let attempts = 0;
  const maxAttempts = 10; // Sécurité anti-boucle infinie

  while (attempts < maxAttempts) {
    attempts++;

    const result = await getMatchHistory(steamId, authCode, currentCode);

    if (!result.success) {
      return {
        ...result,
        matches: allMatches,
      };
    }

    if (result.matches.length > 0) {
      allMatches.push(...result.matches);
    }

    if (!result.nextCode || result.nextCode === currentCode) {
      // Plus de matchs disponibles
      break;
    }

    lastCode = result.nextCode;
    currentCode = result.nextCode;

    // Petit délai pour éviter de spam l'API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return {
    success: true,
    matches: allMatches,
    nextCode: lastCode,
  };
}