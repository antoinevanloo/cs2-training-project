/**
 * Steam OpenID Provider for NextAuth
 *
 * Steam utilise OpenID 2.0 (pas OAuth 2.0 standard).
 * Ce provider gère l'authentification via Steam OpenID.
 */

import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';

interface SteamProfile {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff?: number;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

interface SteamProviderConfig extends OAuthUserConfig<SteamProfile> {
  apiKey: string;
}

// URLs Steam OpenID
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_URL = 'https://api.steampowered.com';

/**
 * Extrait le SteamID64 de l'URL claimed_id OpenID
 */
export function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Récupère le profil Steam via l'API
 */
export async function getSteamProfile(steamId: string, apiKey: string): Promise<SteamProfile | null> {
  try {
    const response = await fetch(
      `${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
    );

    if (!response.ok) {
      console.error('Steam API error:', response.status);
      return null;
    }

    const data = await response.json();
    const players = data?.response?.players;

    if (!players || players.length === 0) {
      return null;
    }

    return players[0] as SteamProfile;
  } catch (error) {
    console.error('Error fetching Steam profile:', error);
    return null;
  }
}

/**
 * Construit l'URL d'authentification Steam OpenID
 */
export function buildSteamAuthUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': callbackUrl,
    'openid.realm': new URL(callbackUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Vérifie la signature OpenID retournée par Steam
 */
export async function verifySteamOpenIdResponse(
  params: URLSearchParams
): Promise<boolean> {
  const verifyParams = new URLSearchParams();

  // Copier tous les paramètres OpenID
  params.forEach((value, key) => {
    if (key.startsWith('openid.')) {
      verifyParams.append(key, value);
    }
  });

  // Changer le mode en check_authentication
  verifyParams.set('openid.mode', 'check_authentication');

  try {
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    const text = await response.text();
    return text.includes('is_valid:true');
  } catch (error) {
    console.error('Error verifying Steam OpenID:', error);
    return false;
  }
}

/**
 * Provider Steam pour NextAuth (custom implementation)
 *
 * Note: Steam n'est pas un provider OAuth standard.
 * On utilise une route API custom pour gérer le flux OpenID.
 */
export default function SteamProvider(config: SteamProviderConfig): OAuthConfig<SteamProfile> {
  return {
    id: 'steam',
    name: 'Steam',
    type: 'oauth',

    // Ces valeurs ne sont pas utilisées car Steam utilise OpenID, pas OAuth
    // Mais NextAuth les requiert pour le type OAuthConfig
    authorization: {
      url: STEAM_OPENID_URL,
      params: {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      },
    },

    token: {
      url: 'https://steamcommunity.com/openid/login', // Placeholder
    },

    userinfo: {
      url: `${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v2/`,
    },

    clientId: config.apiKey, // Steam utilise une API key, pas un client ID
    clientSecret: config.apiKey,

    profile(profile: SteamProfile) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: null, // Steam ne fournit pas l'email
        image: profile.avatarfull,
        steamId: profile.steamid,
        steamUsername: profile.personaname,
      };
    },

    options: config,
  };
}

export type { SteamProfile, SteamProviderConfig };
