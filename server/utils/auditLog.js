import { prismaContext } from "./prismaContext.js";

export const createAuditLog = async ({ userId, action, entity, recordId, oldData, newData }) => {
  try {
    const prisma = prismaContext.get();
    await prisma.audit_logs.create({
      data: {
        entity,
        record_id: recordId ? parseInt(recordId) : null,
        action,
        old_data: oldData ?? null,
        new_data: newData ?? null,
        user_id: userId ? parseInt(userId) : null,
      },
    });
  } catch (err) {
    console.error("[audit]", err.message);
  }
};
