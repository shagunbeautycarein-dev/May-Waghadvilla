import { prisma } from "./prisma";

export async function logAudit(data: {
  adminId?: string;
  adminName?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        adminName: data.adminName,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : undefined,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
