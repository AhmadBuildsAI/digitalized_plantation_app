import { ActivityAction } from '@prisma/client';
import prisma from '../config/database';

interface LogActivityParams {
  userId?: string;
  action: ActivityAction;
  details?: string;
  device?: string;
  ipAddress?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        details: params.details,
        device: params.device,
        ipAddress: params.ipAddress,
        status: params.status || 'success',
        metadata: params.metadata as object | undefined,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to log activity:', error);
  }
}

export async function logAudit(params: {
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        oldValue: params.oldValue as object | undefined,
        newValue: params.newValue as object | undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to log audit:', error);
  }
}
