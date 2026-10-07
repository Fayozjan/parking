# Important Files

**Обновлено:** 2026-06-08

## Backend

### `server/server.js`
Точка запуска приложения. Запускает Express на порту 7000, graceful shutdown, запускает `notificationsWorker`.

### `server/app.js`
Express конфигурация: middleware стек, статика `/client/dist`, монтирование `/api` роутера.

### `server/config.js`
Централизованный доступ к env-переменным. Всегда читать отсюда, не из `process.env` напрямую.

### `server/routes/index.js`
Центральный роутер — монтирует 8 модулей на их пути. Добавление нового модуля начинается здесь.

### `server/middlewares/authMiddleware.js`
Проверяет `access_token` cookie, декодирует JWT, кладёт `req.user`.  
`authPhotoMiddleware` — облегчённая версия для GET `/vehicle-passes/image/*`.

### `server/prisma/schema.public.prisma`
Единственная Prisma-схема. Источник истины для всех моделей данных. При изменении модели — сначала сюда, потом `prisma generate`.

### `server/workers/notificationsWorker.js`
Фоновый worker: читает `notifications_outbox` со статусом `pending`, отправляет Telegram-сообщения через Bot API, обновляет статус (`sent` / `failed`).

### `server/modules/anprCameras/anprCameras.service.js`
Ключевая бизнес-логика: обработка входящих событий от ANPR-камер — сохранение фото, создание `vehicle_passes`, постановка в `notifications_outbox`.

---

## Frontend

### `client/src/App.jsx`
Корневой компонент. Двойная маршрутизация: `/` (WebLayout) и `/tg/` (TelegramLayout). Рендерит глобальный `<Alert>`.

### `client/src/routes.jsx`
Веб-маршруты с ленивой загрузкой. Добавление новой страницы начинается здесь.

### `client/src/telegramRoutes.jsx`
Telegram Web App маршруты. Используют `TelegramLayout`.

### `client/src/api/instance.js`
Axios-инстанс с базовым URL `/api`. Interceptor: при 401 → `/api/auth/refresh` → повтор запроса. При fail refresh → logout.

### `client/src/stores/authStore.js`
Zustand store авторизации: user, theme, language, sidebar, access rights, login/logout/refresh. Персистируется в localStorage.

### `client/src/stores/alertStore.js`
Глобальный toast store. `showAlert(message, type)` — везде для success/error уведомлений.

### `client/src/hooks/usePermissions.js`
RBAC хук. Принимает path (или menu_name), возвращает `{ can_view, can_add, can_update, can_delete }`.

### `client/src/layouts/WebLayout.jsx`
Основной layout: `<Sidebar>` слева, `<Outlet>` справа, `<Alert>` overlay.

### `client/src/layouts/TelegramLayout.jsx`
Layout Telegram: `<BottomNavTelegram>` снизу, `<Outlet>` сверху.

### `client/src/styles/themes.scss`
CSS-переменные light/dark тем. Используется во всех `.module.scss` файлах.

### `client/vite.config.js`
Dev-сервер на порту 5000, proxy `/api` → `localhost:7000`. При изменении портов — обновлять здесь.

### `client/src/locales/ru.json`
Основной языковой файл (русский). При добавлении нового текста — ключи добавлять в **все 4** файла: `ru.json`, `uz.json`, `uzCyrl.json`, `en.json`.
