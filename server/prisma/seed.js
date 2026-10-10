import { PrismaClient } from "../prisma-clients/public/index.js";
import { fileURLToPath } from "url";

async function seed() {
  console.log("🌱 Starting database seed...");
  const prisma = new PrismaClient();
  try {
    await seedData(prisma);
    console.log("✅ Seed data created successfully");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) seed().catch((err) => console.error("Seed failed:", err));

export async function seedData(prisma) {
  let user = await prisma.users.findUnique({ where: { username: "root" } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        username: "root",
        password:
          "$2b$10$iOgDrBgGzTqU5QmyHSqA8OeFbfrDU1Bkh8v0i50amJah6X9XUZC6y",
        language: "ru",
        theme: "light",
        sidebar: "opened",
        status: true,
        can_view_open_parkings: true,
      },
    });
  }

  await prisma.menus.upsert({
    where: { name: "home" },
    update: {},
    create: { name: "home", path: "/home", sort_order: 1 },
  });

  // Меню "Финансы" убрано из меню — чистим из БД, если осталось от прошлых сидов
  const financeMenu = await prisma.menus.findUnique({ where: { name: "finance" } });
  if (financeMenu) {
    await prisma.user_menu_access.deleteMany({ where: { menu_id: financeMenu.id } });
    await prisma.menus.delete({ where: { id: financeMenu.id } });
  }

  await prisma.menus.upsert({
    where: { name: "vehicle-passes" },
    update: {},
    create: {
      name: "vehicle-passes",
      path: "/vehicle-passes",
      sort_order: 3,
      module: "vehicle-passes",
    },
  });

  const settings = await prisma.menus.upsert({
    where: { name: "settings" },
    update: {},
    create: { name: "settings", path: "/settings", sort_order: 4 },
  });

  const settingsChildren = [
    { name: "users", path: "/users", sort_order: 1 },
    { name: "locations", path: "/locations", sort_order: 2 },
    { name: "gates", path: "/gates", sort_order: 3 },
    { name: "vehicle-cameras", path: "/vehicle-cameras", sort_order: 4 },
    { name: "vehicle-whitelist", path: "/vehicle-whitelist", sort_order: 5 },
    { name: "camera-logs", path: "/camera-logs", sort_order: 6 },
    { name: "audit-logs", path: "/audit-logs", sort_order: 7 },
    { name: "history-conflicts", path: "/history-conflicts", sort_order: 8 },
    { name: "ai-training", path: "/ai-training", sort_order: 9 },
  ];

  for (const item of settingsChildren) {
    await prisma.menus.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item, parent_id: settings.id },
    });
  }

  const allMenus = await prisma.menus.findMany();
  await prisma.user_menu_access.createMany({
    data: allMenus.map((menu) => ({
      user_id: user.id,
      menu_id: menu.id,
      can_view: true,
      can_add: true,
      can_update: true,
      can_delete: true,
    })),
    skipDuplicates: true,
  });
}
