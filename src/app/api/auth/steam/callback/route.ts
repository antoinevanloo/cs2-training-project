/**
 * Steam OpenID Authentication - Callback
 *
 * GET /api/auth/steam/callback
 * Traite la réponse d'authentification Steam OpenID
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import {
  extractSteamId,
  getSteamProfile,
  verifySteamOpenIdResponse,
} from '@/lib/auth/steam-provider';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Récupérer le cookie de retour
  const cookieStore = await cookies();
  const returnTo = cookieStore.get('steam_auth_return')?.value || '/dashboard';

  // Vérifier le mode OpenID
  const mode = searchParams.get('openid.mode');

  if (mode === 'cancel') {
    return NextResponse.redirect(new URL('/login?error=SteamAuthCancelled', req.nextUrl.origin));
  }

  if (mode !== 'id_res') {
    return NextResponse.redirect(new URL('/login?error=SteamAuthFailed', req.nextUrl.origin));
  }

  // Vérifier la signature OpenID avec Steam
  const isValid = await verifySteamOpenIdResponse(searchParams);

  if (!isValid) {
    console.error('Steam OpenID signature verification failed');
    return NextResponse.redirect(new URL('/login?error=SteamAuthInvalid', req.nextUrl.origin));
  }

  // Extraire le SteamID64
  const claimedId = searchParams.get('openid.claimed_id');

  if (!claimedId) {
    return NextResponse.redirect(new URL('/login?error=SteamAuthNoId', req.nextUrl.origin));
  }

  const steamId = extractSteamId(claimedId);

  if (!steamId) {
    return NextResponse.redirect(new URL('/login?error=SteamAuthInvalidId', req.nextUrl.origin));
  }

  // Récupérer le profil Steam
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    console.error('STEAM_API_KEY not configured');
    return NextResponse.redirect(new URL('/login?error=SteamNotConfigured', req.nextUrl.origin));
  }

  const steamProfile = await getSteamProfile(steamId, apiKey);

  if (!steamProfile) {
    return NextResponse.redirect(new URL('/login?error=SteamProfileFailed', req.nextUrl.origin));
  }

  // Chercher ou créer l'utilisateur
  let user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    // Générer un username unique basé sur le nom Steam
    const baseUsername = steamProfile.personaname
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'player';

    let username = baseUsername;
    let counter = 1;

    // Vérifier l'unicité du username
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Générer un email placeholder (Steam ne fournit pas l'email)
    const placeholderEmail = `steam_${steamId}@cs2coach.local`;

    // Créer le nouvel utilisateur
    user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        username,
        steamId,
        steamUsername: steamProfile.personaname,
        avatarUrl: steamProfile.avatarfull,
        // Pas de passwordHash pour les comptes Steam
      },
    });
  } else {
    // Mettre à jour les infos Steam (username, avatar)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        steamUsername: steamProfile.personaname,
        avatarUrl: steamProfile.avatarfull,
        lastLoginAt: new Date(),
      },
    });
  }

  // Créer le token JWT NextAuth
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error('NEXTAUTH_SECRET not configured');
    return NextResponse.redirect(new URL('/login?error=ConfigurationError', req.nextUrl.origin));
  }

  const token = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.username,
      picture: user.avatarUrl,
      steamId: user.steamId,
      sub: user.id,
    },
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  });

  // Créer la réponse avec le cookie de session
  const response = NextResponse.redirect(new URL(returnTo, req.nextUrl.origin));

  // Définir le cookie de session NextAuth
  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    path: '/',
  });

  // Supprimer le cookie temporaire
  response.cookies.delete('steam_auth_return');

  return response;
}
