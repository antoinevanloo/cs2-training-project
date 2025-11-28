import { auth } from './config';
import { redirect } from 'next/navigation';

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function requireAuthAPI() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}
