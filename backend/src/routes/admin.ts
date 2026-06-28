import { Router } from 'express';
import { z } from 'zod';
import { UserRole, ActivityAction, TicketStatus } from '@prisma/client';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, successResponse, AppError } from '../utils/errors';
import { hashPassword } from '../services/authService';
import { logActivity, logAudit } from '../utils/activityLogger';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPER_ADMIN));

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [totalCustomers, activeCustomers, totalPlantations, openTickets, criticalAlerts, onlinePlantations] =
      await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { user: { isActive: true } } }),
        prisma.plantation.count(),
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'REOPENED'] } } }),
        prisma.notification.count({ where: { priority: 'CRITICAL', isRead: false, isArchived: false } }),
        prisma.plantation.count({ where: { isOnline: true } }),
      ]);

    successResponse(res, {
      stats: {
        totalCustomers,
        activeCustomers,
        totalPlantations,
        openTickets,
        criticalAlerts,
        onlinePlantations,
      },
    });
  })
);

router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const where = {
      ...(isActive !== undefined && { user: { isActive } }),
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
          { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true, lastLoginAt: true } },
          plantations: { include: { equipment: true }, take: 1 },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    successResponse(res, customers, 200, { page, limit, total });
  })
);

router.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        plantations: { include: { equipment: true, notifications: { take: 5, orderBy: { createdAt: 'desc' } } } },
        supportTickets: { orderBy: { updatedAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new AppError(404, 'Customer not found');
    const { passwordHash: _, ...safeUser } = customer.user;
    successResponse(res, { ...customer, user: safeUser });
  })
);

router.post(
  '/customers',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        companyName: z.string().optional(),
        phone: z.string().optional(),
      })
      .parse(req.body);

    const passwordHash = await hashPassword(body.password);
    const customer = await prisma.customer.create({
      data: {
        companyName: body.companyName,
        manualControlEnabled: false,
        user: {
          create: {
            email: body.email.toLowerCase(),
            passwordHash,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            role: UserRole.CUSTOMER,
          },
        },
        plantations: {
          create: {
            name: `${body.companyName || body.firstName}'s Plantation`,
            location: 'Not specified',
            connectedDevices: 5,
            equipment: {
              create: [
                { type: 'WATER_PUMP', name: 'Water Pump' },
                { type: 'INTAKE_FAN', name: 'Intake Fan' },
                { type: 'EXHAUST_FAN', name: 'Exhaust Fan' },
                { type: 'GROW_LIGHTS', name: 'Grow Lights' },
                { type: 'HUMIDIFIER', name: 'Humidifier' },
              ],
            },
          },
        },
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    await logAudit({
      userId: req.user!.userId,
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CREATE',
      newValue: { email: body.email },
      ipAddress: req.ip,
    });

    successResponse(res, customer, 201);
  })
);

router.patch(
  '/customers/:id',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
        manualControlEnabled: z.boolean().optional(),
      })
      .parse(req.body);

    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!customer) throw new AppError(404, 'Customer not found');

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        companyName: body.companyName,
        manualControlEnabled: body.manualControlEnabled,
        user: {
          update: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            isActive: body.isActive,
          },
        },
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } } },
    });

    await logActivity({
      userId: req.user!.userId,
      action: ActivityAction.ACCOUNT_UPDATE,
      details: `Updated customer ${customer.user.email}`,
      ipAddress: req.ip,
    });

    successResponse(res, updated);
  })
);

router.delete(
  '/customers/:id',
  authorize(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!customer) throw new AppError(404, 'Customer not found');

    await prisma.user.delete({ where: { id: customer.userId } });
    successResponse(res, { message: 'Customer deleted' });
  })
);

router.get(
  '/plantations',
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || '';
    const status = req.query.status as string | undefined;

    const plantations = await prisma.plantation.findMany({
      where: {
        ...(status && { status: status as never }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { customer: { companyName: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        customer: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        equipment: true,
        notifications: { where: { isRead: false }, take: 3 },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    successResponse(res, plantations);
  })
);

router.get(
  '/activity-logs',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;

    const where = action ? { action: action as ActivityAction } : {};

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    successResponse(res, logs, 200, { page, limit, total });
  })
);

router.get(
  '/emergencies',
  asyncHandler(async (req, res) => {
    const severity = req.query.severity as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    const notifications = await prisma.notification.findMany({
      where: {
        priority: severity ? (severity as never) : { in: ['HIGH', 'CRITICAL'] },
        isArchived: false,
        ...(customerId && { plantation: { customerId } }),
      },
      include: {
        plantation: {
          include: {
            customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    successResponse(res, notifications);
  })
);

router.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where = {
      ...(status && { status: status as TicketStatus }),
      ...(search && { subject: { contains: search, mode: 'insensitive' as const } }),
    };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    successResponse(res, tickets, 200, { page, limit, total });
  })
);

router.get(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } },
        },
        assignedTo: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!ticket) throw new AppError(404, 'Ticket not found');
    successResponse(res, ticket);
  })
);

router.patch(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'REOPENED']).optional(),
        assignedToId: z.string().uuid().optional().nullable(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      })
      .parse(req.body);

    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        ...body,
        closedAt: body.status === 'CLOSED' ? new Date() : undefined,
      },
      include: { assignedTo: { select: { firstName: true, lastName: true } } },
    });

    successResponse(res, updated);
  })
);

router.post(
  '/tickets/:id/messages',
  asyncHandler(async (req, res) => {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: req.params.id,
        senderId: req.user!.userId,
        content,
        isStaff: true,
      },
      include: { sender: { select: { firstName: true, lastName: true, role: true } } },
    });

    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    });

    successResponse(res, message, 201);
  })
);

router.patch(
  '/customers/:id/manual-control',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { manualControlEnabled: enabled },
    });

    await prisma.permission.create({
      data: {
        customerId: req.params.id,
        manualControlEnabled: enabled,
        grantedById: req.user!.userId,
      },
    });

    await logAudit({
      userId: req.user!.userId,
      entityType: 'Permission',
      entityId: req.params.id,
      action: enabled ? 'ENABLE_MANUAL_CONTROL' : 'DISABLE_MANUAL_CONTROL',
      newValue: { manualControlEnabled: enabled },
      ipAddress: req.ip,
    });

    successResponse(res, updated);
  })
);

export default router;
