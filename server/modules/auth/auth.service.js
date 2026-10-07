import { AuthModel } from "./auth.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const TIME_ZONE = "Asia/Tashkent";

// Часовой пояс парковки, не сервера — хранимое время тоже вводится в этой зоне.
const minutesOfDayLocal = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
};

// db.Time хранится буквально (UTC-обёртка без смысла зоны), читаем как есть.
const minutesOfDayUTC = (date) => date.getUTCHours() * 60 + date.getUTCMinutes();

const checkAccessPeriod = (user) => {
  if (!user.access_from && !user.access_until) return;

  const now = minutesOfDayLocal(new Date());
  const from = user.access_from ? minutesOfDayUTC(user.access_from) : null;
  const until = user.access_until ? minutesOfDayUTC(user.access_until) : null;

  let allowed;
  if (from !== null && until !== null) {
    allowed =
      from <= until ? now >= from && now <= until : now >= from || now <= until;
  } else if (from !== null) {
    allowed = now >= from;
  } else {
    allowed = now <= until;
  }

  if (!allowed) {
    throw {
      status: 403,
      code: "OUTSIDE_ACCESS_HOURS",
      message: "Login is only allowed during the configured hours.",
    };
  }
};

const signTokens = (userId, username) => {
  const accessToken = jwt.sign(
    { id: userId, username },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, {
    expiresIn: "8h",
  });
  return { accessToken, refreshToken };
};

export const AuthService = {
  login: async (username, password, language, theme) => {
    const user = await AuthModel.findUserByUsername(username);

    if (!user) {
      throw {
        status: 403,
        code: "NOT_REGISTERED",
        message: "Not registered. Contact your administrator.",
      };
    }

    if (!user.status) {
      throw { status: 403, code: "DISABLED", message: "Account is disabled." };
    }

    checkAccessPeriod(user);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw {
        status: 401,
        message: "Invalid credentials",
        code: "AUTH_INVALID_CREDENTIALS",
      };

    if (language && language !== user.language) {
      user.language = (
        await AuthModel.updateUserLanguage(user.id, language)
      ).language;
    }

    if (theme && theme !== user.theme) {
      user.theme = (
        await AuthModel.updateUserTheme(user.id, theme)
      ).theme;
    }

    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, {
      expiresIn: "8h",
    });
    await AuthModel.createSession({ userId: user.id, refreshToken });

    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user?.id,
        language: user?.language,
        theme: user?.theme,
        sidebar: user?.sidebar,
        first_name: user?.first_name,
        last_name: user?.last_name,
        photo: user?.avatar,
      },
    };
  },

  telegramLogin: async (id) => {
    const telegramId = String(id);

    const user = await AuthModel.findUserByTelegramId(telegramId);

    if (!user) {
      throw {
        status: 403,
        code: "NOT_REGISTERED",
        message: "Not registered. Contact your administrator.",
      };
    }

    if (!user.status) {
      throw { status: 403, code: "DISABLED", message: "Account is disabled." };
    }

    checkAccessPeriod(user);

    const { accessToken, refreshToken } = signTokens(user.id, user.username);
    await AuthModel.createSession({ userId: user.id, refreshToken });

    return {
      accessToken,
      refreshToken,
      user: {
        language: user.language,
        theme: user.theme,
        sidebar: user.sidebar,
        first_name: user.first_name,
        last_name: user.last_name,
        photo: user.avatar,
      },
    };
  },

  logout: async (refreshToken) => {
    if (!refreshToken) return;
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      await AuthModel.deleteSession({ userId: payload.id, refreshToken });
    } catch {
      // Игнорируем ошибки
    }
  },

  refresh: async (refreshToken) => {
    if (!refreshToken) throw { status: 401, message: "Refresh token required" };

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch {
      throw { status: 403, message: "Invalid refresh token" };
    }

    const session = await AuthModel.findSession({
      userId: payload.id,
      refreshToken,
    });
    if (!session)
      throw { status: 401, message: "Session not found or expired" };

    // Новый refresh token (опционально)
    const newRefreshToken = jwt.sign(
      { id: payload.id },
      process.env.REFRESH_SECRET,
      { expiresIn: "8h" },
    );
    await AuthModel.updateSession(payload.id, refreshToken, newRefreshToken);

    const accessToken = jwt.sign(
      { id: payload.id },
      process.env.ACCESS_SECRET,
      {
        expiresIn: "15m",
      },
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  getMe: async (userId) => {
    const user = await AuthModel.findUserById(userId);
    if (!user) throw { status: 404, message: "User not found" };
    return user;
  },
};
