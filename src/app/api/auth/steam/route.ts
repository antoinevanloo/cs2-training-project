/**
 * Steam OpenID Authentication - Initiation
 *
 * GET /api/auth/steam
 * Redirige vers Steam pour l'authentification OpenID
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildSteamAuthUrl } from '@/lib/auth/steam-provider';

export async function GET(req: NextRequest) {
  const callbackUrl = `${req.nextUrl.origin}/api/auth/steam/callback`;

  // Stocker l'URL de retour originale dans un cookie
  const returnTo = req.nextUrl.searchParams.get('callbackUrl') || '/dashboard';

  const steamAuthUrl = buildSteamAuthUrl(callbackUrl);

  const response = NextResponse.redirect(steamAuthUrl);

  // Cookie pour savoir où rediriger après l'auth
  response.cookies.set('steam_auth_return', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}