import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      stats: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserBySteamId(steamId: string) {
  return prisma.user.findUnique({
    where: { steamId },
    include: {
      stats: true,
    },
  });
}

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  steamId?: string;
  steamUsername?: string;
  avatarUrl?: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      steamId: data.steamId,
      steamUsername: data.steamUsername,
      avatarUrl: data.avatarUrl,
      stats: {
        create: {},
      },
    },
    include: {
      stats: true,
    },
  });
}

export async function updateUser(
  id: string,
  data: {
    username?: string;
    avatarUrl?: string;
    preferredMaps?: string[];
    preferredRole?: string;
  }
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function updateUserPassword(id: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);

  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}

export async function updateUserStorageUsage(id: string, sizeMb: number) {
  return prisma.user.update({
    where: { id },
    data: {
      storageUsedMb: {
        increment: sizeMb,
      },
    },
  });
}

export async function checkStorageLimit(userId: string, fileSizeMb: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      storageUsedMb: true,
      maxStorageMb: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.storageUsedMb + fileSizeMb <= user.maxStorageMb;
}

export async function linkSteamAccount(
  userId: string,
  steamId: string,
  steamUsername: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      steamId,
      steamUsername,
    },
  });
}

export async function updateLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
    },
  });
}
