import { PrismaClient } from "../prisma-clients/public/index.js";

export const prismaPublic = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

export const getPrismaForTenant = () => prismaPublic;

export async function disconnectAll() {
  await prismaPublic.$disconnect();
}
