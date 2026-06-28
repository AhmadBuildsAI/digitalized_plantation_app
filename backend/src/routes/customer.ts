import { Router } from 'express';
import { z } from 'zod';
import { EquipmentState, DeviceStatus, ActivityAction } from '@prisma/client';
import prisma from '../config/database';
import { authenticate, authorize, getCustomerId } from '../middleware/auth';
import { asyncHandler, successResponse, AppError } from '../utils/errors';
import { logActivity } from '../utils/activityLogger';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.CUSTOMER));

async function getCustomerPlantation(userId: string) {
  const customerId = await getCustomerId(userId);
  if (!customerId) throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');

  const plantation = await prisma.plantation.findFirst({
    where: { customerId },
    include: {
      equipment: { orderBy: { type: 'asc' } },
      notifications: {
        where: { isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!plantation) throw new AppError(404, 'Plantation not found', 'NOT_FOUND');
  return { customerId, plantation };
}

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { plantation } = await getCustomerPlantation(req.user!.userId);

    const unreadAlerts = await prisma.notification.count({
      where: { plantationId: plantation.id, isRead: false, isArchived: false },
    });

    const activeEquipment = plantation.equipment.filter(
      (e) => e.status === DeviceStatus.ACTIVE || e.status === DeviceStatus.ONLINE
    ).length;

    successResponse(res, {
      overview: {
        status: plantation.status,
        isOnline: plantation.isOnline,
        connectedDevices: plantation.connectedDevices,
        activeEquipment,
        totalEquipment: plantation.equipment.length,
        unreadAlerts,
        lastUpdated: plantation.lastActivityAt,
      },
      plantation: {
        id: plantation.id,
        name: plantation.name,
        location: plantation.location,
        status: plantation.status,
      },
      equipment: plantation.equipment,
      recentAlerts: plantation.notifications,
    });
  })
);

router.get(
  '/plantation',
  asyncHandler(async (req, res) => {
    const { plantation } = await getCustomerPlantation(req.user!.userId);
    successResponse(res, plantation);
  })
);

router.get(
  '/equipment',
  asyncHandler(async (req, res) => {
    const { plantation } = await getCustomerPlantation(req.user!.userId);
    successResponse(res, plantation.equipment);
  })
);

router.post(
  '/equipment/:id/control',
  asyncHandler(async (req, res) => {
    const { state } = z.object({ state: z.enum(['ON', 'OFF']) }).parse(req.body);
    const customerId = await getCustomerId(req.user!.userId);
    if (!customerId) throw new AppError(404, 'Customer not found');

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.manualControlEnabled) {
      throw new AppError(403, 'Manual control is not enabled for your account', 'MANUAL_CONTROL_DISABLED');
    }

    const equipment = await prisma.equipment.findFirst({
      where: { id: req.params.id, plantation: { customerId } },
    });
    if (!equipment) throw new AppError(404, 'Equipment not found');

    const newState = state as EquipmentState;
    const updated = await prisma.equipment.update({
      where: { id: equipment.id },
      data: {
        state: newState,
        status: newState === EquipmentState.ON ? DeviceStatus.ACTIVE : DeviceStatus.INACTIVE,
        lastActivityAt: new Date(),
      },
    });

    await prisma.equipmentLog.create({
      data: {
        equipmentId: equipment.id,
        userId: req.user!.userId,
        action: `Manual ${state}`,
        previousState: equipment.state,
        newState,
        status: updated.status,
        ipAddress: req.ip,
      },
    });

    await logActivity({
      userId: req.user!.userId,
      action: ActivityAction.EQUIPMENT_CONTROL,
      details: `${equipment.name} turned ${state}`,
      ipAddress: req.ip,
    });

    successResponse(res, updated);
  })
);

router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { plantation } = await getCustomerPlantation(req.user!.userId);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { plantationId: plantation.id, isArchived: false },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { plantationId: plantation.id, isArchived: false } }),
      prisma.notification.count({ where: { plantationId: plantation.id, isRead: false, isArchived: false } }),
    ]);

    successResponse(res, notifications, 200, { page, limit, total, unreadCount });
  })
);

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const { plantation } = await getCustomerPlantation(req.user!.userId);
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, plantationId: plantation.id },
      data: { isRead: true },
    });
    successResponse(res, { updated: notification.count });
  })
);

router.patch(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    const { plantation } = await getCustomerPlantation(req.user!.userId);
    const result = await prisma.notification.updateMany({
      where: { plantationId: plantation.id, isRead: false },
      data: { isRead: true },
    });
    successResponse(res, { updated: result.count });
  })
);

router.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const customerId = await getCustomerId(req.user!.userId);
    if (!customerId) throw new AppError(404, 'Customer not found');

    const tickets = await prisma.supportTicket.findMany({
      where: { customerId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    successResponse(res, tickets);
  })
);

router.post(
  '/tickets',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        subject: z.string().min(3),
        category: z.enum(['MVP_TECHNICAL', 'PLANTATION_GUIDANCE', 'GENERAL_INQUIRY', 'EMERGENCY_SUPPORT']),
        message: z.string().min(1),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      })
      .parse(req.body);

    const customerId = await getCustomerId(req.user!.userId);
    if (!customerId) throw new AppError(404, 'Customer not found');

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId,
        subject: body.subject,
        category: body.category,
        priority: body.priority || 'MEDIUM',
        messages: {
          create: {
            senderId: req.user!.userId,
            content: body.message,
            isStaff: false,
          },
        },
      },
      include: { messages: true },
    });

    await logActivity({
      userId: req.user!.userId,
      action: ActivityAction.SUPPORT_MESSAGE,
      details: `Created ticket: ${body.subject}`,
    });

    successResponse(res, ticket, 201);
  })
);

router.get(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const customerId = await getCustomerId(req.user!.userId);
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, customerId: customerId! },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } },
        },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });
    if (!ticket) throw new AppError(404, 'Ticket not found');
    successResponse(res, ticket);
  })
);

router.post(
  '/tickets/:id/messages',
  asyncHandler(async (req, res) => {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const customerId = await getCustomerId(req.user!.userId);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, customerId: customerId! },
    });
    if (!ticket) throw new AppError(404, 'Ticket not found');

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user!.userId,
        content,
        isStaff: false,
      },
      include: { sender: { select: { firstName: true, lastName: true } } },
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    successResponse(res, message, 201);
  })
);

export default router;
