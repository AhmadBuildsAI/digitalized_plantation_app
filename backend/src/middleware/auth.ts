import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../utils/errors';
import prisma from '../config/database';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

  if (!token) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'TOKEN_INVALID'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

export function isInternalTeam(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPER_ADMIN].includes(role);
}

export async function getCustomerId(userId: string): Promise<string | null> {
  const customer = await prisma.customer.findUnique({ where: { userId }, select: { id: true } });
  return customer?.id ?? null;
}
