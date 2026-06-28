import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refreshAccessToken } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { asyncHandler, successResponse } from '../utils/errors';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional().default(false),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await login(
      body.email,
      body.password,
      body.rememberMe,
      req.ip,
      req.headers['user-agent']
    );
    successResponse(res, result);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const tokens = await refreshAccessToken(refreshToken);
    successResponse(res, tokens);
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await logout(req.user!.userId, req.body.refreshToken, req.ip);
    successResponse(res, { message: 'Logged out successfully' });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        customerProfile: {
          select: {
            id: true,
            companyName: true,
            manualControlEnabled: true,
          },
        },
      },
    });
    successResponse(res, user);
  })
);

export default router;
