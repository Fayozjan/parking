import { Composer } from "grammy";
import { mainKeyboard } from "../keyboards/mainKeyboard.js";
import { sendDatabaseBackup } from "../services/backupService.js";
import { prismaContext } from "../../../../utils/prismaContext.js";

// Импортируем дочерние обработчики
import attendanceHandler from "./attendanceHandler.js";
import lateMenuHandler from "./lateMenuHandler.js";

const composer = new Composer();

composer.command("start", async (ctx) => {
  const chatId = String(ctx.chat.id);

  try {
    const location = await prismaContext.get().locations.findFirst({
      where: { telegram_chat_ids: { has: chatId } },
      select: { name: true },
    });

    if (location) {
      await ctx.reply(
        `✅ Бот активирован!\n📍 Локация: ${location.name}\n\nВы будете получать уведомления о проездах.`,
      );
    } else {
      await ctx.reply(
        "⚠️ Ваш чат не зарегистрирован в системе.\n\nОбратитесь к администратору для привязки этого чата к локации.",
      );
    }
  } catch (err) {
    console.error("Ошибка при обработке /start:", err);
    await ctx.reply("❌ Произошла ошибка. Попробуйте позже.");
  }
});

composer.command("backup", async (ctx) => {
  try {
    await ctx.reply("🔄 Запускаю ручной бэкап...");
    await sendDatabaseBackup(ctx.bot); // Передаем инстанс бота
    await ctx.reply("✅ Бэкап успешно отправлен!");
  } catch (err) {
    await ctx.reply("❌ Ошибка при создании бэкапа. Проверьте логи сервера.");
  }
});

// Кнопка "Назад" — общая для всех подменю
composer.hears("⬅️ Назад", async (ctx) => {
  await ctx.reply("Возвращаю в главное меню", {
    reply_markup: mainKeyboard,
  });
});

composer.use(attendanceHandler);
composer.use(lateMenuHandler);

export { composer as setupCommands };
