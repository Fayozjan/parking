# Architecture — OnBase Parking System

**Обновлено:** 2026-06-08

---

## Обзор

Система управления парковкой. Единый сервер, одна PostgreSQL-схема, двойной UI (веб + Telegram Web App).

```
Browser / Telegram WebApp
       │
       ▼
  Vite Dev Server :5000  ──proxy /api──▶  Express :7000
       │                                        │
       ▼                                        ▼
  React SPA (client/)              PostgreSQL :5432
                                   └── schema: public (все таблицы)

  ANPR Camera ──HTTP POST──▶  /api/anpr-cameras/events (без auth)
                                        │
                                  vehicle_passes + notifications_outbox
                                        │
                              notificationsWorker → Telegram Bot
```

---

## Сервер (`server/`)

### Точка входа

| Файл | Назначение |
|------|-----------|
| `server.js` | HTTP сервер на порту 7000, graceful shutdown, запуск workers |
| `app.js` | Express middleware stack, монтирование роутов на `/api` |
| `config.js` | ENV конфиг: PORT, DATABASE_URL, ACCESS_SECRET, REFRESH_SECRET |

### Middleware стек (порядок применения)

```
cookieParser()
express.json()
express.urlencoded()
    │
    └── /api/*
         ├── authMiddleware     — JWT access_token из cookie → req.user
         ├── authPhotoMiddleware — облегчённая auth для GET /vehicle-passes/image/*
         └── uploadPhoto        — multer (disk) + sharp (→ jpeg, max 200KB)
```

**Важно:** нет `tenantMiddleware` — этот проект single-tenant. Prisma-клиент импортируется напрямую из `prisma-clients/public`.

### Структура модуля

```
modules/<name>/
  <name>.routes.js      — Express Router + middleware chain
  <name>.controller.js  — req/res, без бизнес-логики
  <name>.service.js     — бизнес-правила
  <name>.model.js       — Prisma-запросы
```

### Все модули (8)

| Маршрут | Модуль | Папка |
|---------|--------|-------|
| `/api/auth` | auth | `modules/auth/` |
| `/api/users` | users | `modules/users/` |
| `/api/menus` | menus | `modules/menus/` |
| `/api/parkings` | parkings | `modules/parkings/` |
| `/api/anpr-cameras` | anprCameras | `modules/anprCameras/` |
| `/api/vehicle-passes` | vehiclePasses | `modules/vehiclePasses/` |
| `/api/parking-tariffs` | parkingTariffs | `modules/parkingTariffs/` |
| `/api/audit-logs` | auditLogs | `modules/auditLogs/` |

### Worker

`workers/notificationsWorker.js` — cron-подобный процесс, читает `notifications_outbox` со статусом `pending`, отправляет в Telegram, обновляет статус на `sent` или `failed`.

---

## Auth Flow

```
1. POST /auth/login (username + password)
   → bcrypt.compare → создаёт access token (15m) + refresh token (8h)
   → сохраняет refresh в sessions
   → устанавливает httpOnly cookies: access_token, refresh_token

2. Каждый запрос (кроме /events, /auth/*)
   → authMiddleware: читает access_token cookie → jwt.verify → req.user

3. POST /auth/refresh
   → читает refresh_token cookie → проверяет в sessions → ротация токена

4. POST /auth/telegram (telegram_id)
   → ищет пользователя по telegram_id → те же JWT cookies
```

---

## Camera Event Flow

```
ANPR Camera → POST /api/anpr-cameras/events (multipart)
    │
    ├── [anprCameras.service] распознаёт камеру по IP или MAC
    ├── Сохраняет фото в uploads/vehicle-passes/{year}/{month}/
    ├── Создаёт запись vehicle_passes
    └── Для каждого telegram_chat_id парковки → notifications_outbox (status: pending)
                                                        │
                                        [notificationsWorker, async]
                                                        │
                                              Telegram Bot API → chat_id
```

---

## Frontend

### Маршрутизация

```
App.jsx
  ├── / (WebLayout)
  │   ├── /login → AuthPage
  │   ├── /parkings → ParkingsPage
  │   ├── /anpr-cameras → AnprCamerasPage
  │   ├── /vehicle-passes → VehiclePassesPageWeb
  │   ├── /users → UsersPage
  │   └── /audit-logs → AuditLogsPage
  │
  └── /tg (TelegramLayout)
      ├── /tg/login → AuthPageTelegram
      ├── /tg/vehicle-passes → VehiclePassesPageTelegram
      └── /tg/more → MorePageTelegram
```

### State Management

| Store | Данные |
|-------|--------|
| `authStore` | user, isAuth, login(), logout(), refreshTokens() |
| `alertStore` | showAlert(message, type) — глобальные toast-уведомления |
| `filterDataStore` | персистентные фильтры таблиц (localStorage) |
| `useSidebarStore` | isOpen — состояние бокового меню |

### API Layer

Все вызовы через `client/src/api/<module>.js` — не напрямую через axios instance.
`api/instance.js` содержит interceptor: при 401 → автоматический `/auth/refresh` → повтор запроса.

---

## Конфигурация

### .env (server/)

```
PORT=7000
DATABASE_URL=postgresql://user:pass@localhost:5432/parking
ACCESS_SECRET=...
REFRESH_SECRET=...
NODE_ENV=development
```

### vite.config.js (client/)

```
dev port: 5000
proxy /api → http://localhost:7000
alias @ → src/
```
