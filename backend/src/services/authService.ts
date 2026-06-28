import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, ActivityAction } from '@prisma/client';
import prisma from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { logActivity } from '../utils/activityLogger';
import { AuthPayload } from '../middleware/auth';

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) return 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return value * (multipliers[unit] || 3600000);
}

export function generateTokens(user: { id: string; email: string; role: UserRole }, rememberMe = false) {
  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: rememberMe ? '7d' : config.jwt.expiresIn,
  });
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string, rememberMe = false, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const { accessToken, refreshToken } = generateTokens(user, rememberMe);
  const expiresAt = new Date(Date.now() + (rememberMe ? parseExpiry(config.jwt.refreshExpiresIn) : parseExpiry(config.jwt.expiresIn)));

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      rememberMe,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    userId: user.id,
    action: ActivityAction.LOGIN,
    details: `User logged in: ${user.email}`,
    ipAddress,
    device: userAgent,
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

export async function logout(userId: string, refreshToken?: string, ipAddress?: string) {
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { userId, refreshToken } });
  } else {
    await prisma.session.deleteMany({ where: { userId } });
  }

  await logActivity({
    userId,
    action: ActivityAction.LOGOUT,
    details: 'User logged out',
    ipAddress,
  });
}

export async function refreshAccessToken(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    throw new AppError(401, 'Invalid refresh token', 'TOKEN_INVALID');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user, session.rememberMe);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + parseExpiry(session.rememberMe ? config.jwt.refreshExpiresIn : config.jwt.expiresIn)),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
