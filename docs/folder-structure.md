# Folder Structure

**Обновлено:** 2026-06-08

## Корень проекта

```
OnBase - Parking/
├── client/          — React SPA (Vite, port 5000)
├── server/          — Node.js Express API (port 7000)
└── docs/            — Документация
```

---

## client/src/

```
src/
├── api/                        — Axios-функции для каждого backend-модуля
│   ├── instance.js             — axios-инстанс + refresh interceptor (401 → /auth/refresh)
│   ├── index.js                — центральный реэкспорт всех модулей
│   ├── anprCameras.js          — CRUD для ANPR-камер
│   ├── vehiclePasses.js        — получение проездов (read-only через UI)
│   ├── parkings.js             — CRUD парковок + тарифная история
│   ├── parkingTariffs.js       — CRUD тарифов
│   ├── users.js                — CRUD пользователей + аватар + права
│   ├── menus.js                — дерево меню
│   ├── auditLogs.js            — лог аудита (read-only)
│   └── dashboard.js            — статистика дашборда
│
├── assets/                     — Изображения, иконки
├── icons/                      — Кастомные SVG-иконки как React компоненты
│
├── components/                 — Переиспользуемые UI-компоненты
│   ├── AddDoor.jsx/scss        — Форма добавления
│   ├── AddEmployee*.jsx        — Формы профиля сотрудника (legacy в этом проекте)
│   ├── Sidebar.jsx             — Боковое меню навигации
│   ├── Pagination.jsx          — Пагинация таблиц
│   ├── Button.jsx              — Кнопка (обёртка)
│   ├── Badge.jsx               — Статус-бейдж
│   ├── OverlaySidebar.jsx      — Боковая панель (framer-motion)
│   ├── Search.jsx              — Поле поиска
│   ├── Loading.jsx             — Индикатор загрузки
│   └── BottomNavTelegram.jsx   — Нижняя навигация Telegram
│
├── context/
│   └── ScreenStackContext.jsx  — Стек навигации (Telegram back-button)
│
├── hooks/                      — Кастомные React-хуки
│   ├── useAuthCheck.js         — Проверка авторизации
│   ├── usePermissions.js       — RBAC для веб (can_add, can_update, can_delete)
│   ├── usePermissionsTelegram.js — RBAC для Telegram
│   └── useTelegram.js          — Telegram WebApp SDK интеграция
│
├── layouts/
│   ├── WebLayout.jsx           — Основной layout: Sidebar + content + Alert
│   └── TelegramLayout.jsx      — Telegram layout: BottomNav + content
│
├── locales/                    — Переводы i18next
│   ├── ru.json                 — Русский
│   ├── uz.json                 — Узбекский (латиница)
│   ├── uzCyrl.json             — Узбекский (кириллица)
│   └── en.json                 — Английский
│
├── pages/                      — Страницы (маршруты)
│   ├── AuthPage.jsx            — Веб-логин
│   ├── AuthPageTelegram.jsx    — Telegram-логин
│   ├── HomePage.jsx            — Главная (пустой дашборд)
│   ├── HomePageTelegram.jsx    — Telegram главная
│   ├── MorePageTelegram.jsx    — Telegram "Ещё"
│   ├── ParkingsPage.jsx        — Список парковок + статистика
│   ├── AnprCamerasPage.jsx     — ANPR-камеры
│   ├── VehiclePassesPage.jsx   — Журнал проездов (универсальный)
│   ├── VehiclePassesPageWeb.jsx — Журнал проездов (веб)
│   ├── VehiclePassesPageTelegram.jsx — Журнал проездов (Telegram)
│   ├── UsersPage.jsx           — Управление пользователями
│   ├── AuditLogsPage.jsx       — Журнал аудита (read-only)
│   ├── NoAccessPage.jsx        — Страница "Нет доступа"
│   └── NotFoundPage.jsx        — 404
│
├── stores/                     — Zustand-сторы
│   ├── authStore.js            — Состояние авторизации (user, login, logout, refresh)
│   ├── alertStore.js           — Глобальные уведомления (showAlert)
│   ├── filterDataStore.js      — Состояния фильтров (persistent)
│   └── useSidebarStore.js      — Состояние сайдбара (open/closed)
│
├── styles/                     — Глобальные SCSS-стили
│   └── themes.scss             — CSS-переменные тем (light/dark)
│
├── utils/                      — Утилиты
│   ├── date.js                 — Форматирование дат
│   └── utils.js                — Общие утилиты
│
├── App.jsx                     — Корневой роутер (web + telegram routes)
├── routes.jsx                  — Веб-маршруты
└── telegramRoutes.jsx          — Telegram-маршруты
```

---

## server/

```
server/
├── modules/                    — Бизнес-модули (по одному на домен)
│   ├── auth/                   — JWT аутентификация (login, refresh, logout, telegram)
│   ├── users/                  — Управление пользователями + аватар
│   ├── menus/                  — RBAC меню (иерархия, права доступа)
│   ├── parkings/               — Парковки + тарифная история
│   ├── anprCameras/            — ANPR-камеры + webhook событий
│   ├── vehiclePasses/          — Журнал проездов (+ фото)
│   ├── parkingTariffs/         — Тарифы и слоты ценообразования
│   └── auditLogs/              — Лог изменений (read-only)
│
│   Каждый модуль содержит:
│   ├── <name>.routes.js        — Express Router + middleware chain
│   ├── <name>.controller.js    — req/res, без бизнес-логики
│   ├── <name>.service.js       — бизнес-правила
│   └── <name>.model.js         — Prisma-запросы
│
├── middlewares/
│   ├── authMiddleware.js       — Проверка JWT access token (устанавливает req.user)
│   │                             authPhotoMiddleware — облегчённая auth для GET image/*
│   └── uploadPhoto.js          — Multer + Sharp (→ jpeg, max 200KB)
│
├── prisma/
│   └── schema.public.prisma    — Единственная Prisma-схема (все таблицы)
│
├── prisma-clients/
│   └── public/                 — Авто-сгенерированный Prisma-клиент
│
├── routes/
│   └── index.js                — Центральный роутер (монтирует все модули)
│
├── workers/
│   └── notificationsWorker.js  — Отправка Telegram уведомлений из очереди
│
├── app.js                      — Express конфигурация (middleware stack)
├── server.js                   — Точка запуска (port 7000, graceful shutdown)
├── config.js                   — ENV конфиг (PORT, DATABASE_URL, ACCESS_SECRET, REFRESH_SECRET)
└── db.js                       — PostgreSQL pool (pg) — для raw queries если нужно
```
