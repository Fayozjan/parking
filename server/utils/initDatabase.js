import pg from "pg";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { seedData } from "../prisma/seed.js";
import { PrismaClient } from "../prisma-clients/public/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "..");
const schemaPath = path.join(serverDir, "prisma", "schema.public.prisma");

const { Client } = pg;

export async function initDatabase(databaseUrl) {
  const match = databaseUrl.match(
    /postgresql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/,
  );
  if (!match) throw new Error("❌ Неверный формат DATABASE_URL");

  const [_, user, password, host, port, database] = match;

  const client = new Client({
    user,
    password,
    host,
    port,
    database: "parking",
  });

  await client.connect();

  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
  );

  let isNewDatabase = false;

  if (res.rowCount === 0) {
    console.log(`📦 База "${database}" не найдена — создаю...`);
    await client.query(`CREATE DATABASE "${database}"`);
    console.log("✅ База успешно создана!");
    isNewDatabase = true;
  } else {
    console.log("✅ База уже существует.");
  }

  await client.end();

  try {
    console.log("⚙️ Синхронизирую схему...");
    execSync(`npx prisma db push --skip-generate --schema="${schemaPath}"`, {
      stdio: "inherit",
      cwd: serverDir,
    });
    console.log("✅ Схема синхронизирована.");
  } catch (err) {
    console.error("❌ Ошибка при db push:", err.message);
  }

  const prisma = new PrismaClient();
  try {
    if (isNewDatabase) {
      console.log("🌱 Новая база — запускаю seed...");
      await seedData(prisma);
      console.log("✅ Seed выполнен.");
    } else {
      const root = await prisma.users.findUnique({
        where: { username: "root" },
      });

      if (!root) {
        console.log("👤 Root не найден — запускаю seed...");
        await seedData(prisma);
      } else {
        console.log("✅ Root уже существует — seed пропущен.");
      }
    }
  } catch (err) {
    console.error("❌ Ошибка при выполнении seed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
