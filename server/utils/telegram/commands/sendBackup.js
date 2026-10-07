import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const {
  CHAT_ID,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  PG_DUMP_PATH,
  SERVER_TYPE,
} = process.env;

const BACKUP_PATH = "./backup.sql";

// pg_dump всегда просто "pg_dump", путь мы укажем в PATH
const PG_DUMP = "pg_dump";

// Объединяем системный PATH + путь до pg_dump (если Windows)
const env = {
  ...process.env,
  PGPASSWORD: DB_PASSWORD,
  PATH:
    SERVER_TYPE === "WINDOWS"
      ? `${process.env.PATH};${PG_DUMP_PATH}`
      : process.env.PATH,
};

// Аргументы для pg_dump
// -h/-p обязательны: без них libpq идёт через unix-socket и попадает
// на peer-аутентификацию (OS-юзер должен совпадать с DB_USER), PGPASSWORD игнорируется
const args = [
  "-h",
  DB_HOST || "127.0.0.1",
  "-p",
  DB_PORT || "5432",
  "-U",
  DB_USER,
  "-F",
  "c",
  "-f",
  BACKUP_PATH,
  DB_NAME,
];

const TELEGRAM_API = (botToken) =>
  `https://api.telegram.org/bot${botToken}/sendDocument`;

export async function sendDatabaseBackup(botToken) {
  return new Promise((resolve, reject) => {
    execFile(PG_DUMP, args, { env }, async (error, stdout, stderr) => {
      if (error) {
        console.error("Ошибка при создании бэкапа:", stderr || error.message);
        return reject(error);
      }

      try {
        const formData = new FormData();
        formData.append("chat_id", CHAT_ID);
        formData.append(
          "document",
          fs.createReadStream(path.resolve(BACKUP_PATH))
        );

        await axios.post(TELEGRAM_API(botToken), formData, {
          headers: formData.getHeaders(),
        });

        console.log("✅ Бэкап успешно отправлен в Telegram.");
        resolve();
      } catch (err) {
        console.error("❌ Ошибка при отправке бэкапа:", err.message);
        reject(err);
      }
    });
  });
}
