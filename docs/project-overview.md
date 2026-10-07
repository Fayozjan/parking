# Project Overview — OnBase Parking System

**Обновлено:** 2026-06-08

## Назначение

Система управления парковкой. ANPR-камеры отправляют события (распознавание номерного знака) → сервер сохраняет проезды → пользователи видят историю в веб-интерфейсе и Telegram Web App. Поддерживаются тарифы с почасовой/посуточной тарификацией.

## Основные технологии

| Слой | Технологии |
|------|-----------|
| Frontend | React 18.3, Vite 5, React Router 6, Zustand, Bootstrap 5, MUI 6 |
| Backend | Node.js (ESM), Express 4.21 |
| ORM | Prisma 6 (одна публичная схема) |
| Database | PostgreSQL |
| Auth | JWT (access 15m + refresh 8h), httpOnly cookies |
| UI | Bootstrap 5.3, Material-UI 6.4, SCSS modules |
| Telegram | Grammy (Telegram Bot + Web App) |
| Export | ExcelJS, jsPDF |
| i18n | i18next — ru / uz / uzCyrl / en |

## Архитектурный стиль

- **Monorepo**: `client/` (React SPA) + `server/` (Express REST API)
- **Single-tenant**: одна PostgreSQL-схема `public` для всех данных (нет multi-tenant)
- **Модульный backend**: каждый домен — отдельная папка `modules/<name>/` со своим routes / controller / service / model
- **Двойной UI**: веб-маршруты (`/`) + Telegram Web App маршруты (`/tg/`)

## Взаимодействие частей системы

```
[Telegram WebApp / Browser]
         |
    [React SPA] ──axios──> [Express /api/*]
         |                        |
    [Zustand]              [authMiddleware] → req.user
         |                        |
    [i18next]              [modules/*] → [Prisma → PostgreSQL]
                                  |
                    [ANPR Camera] → POST /api/anpr-cameras/events
                                  |
                    [notificationsWorker] → Telegram уведомления
```

## Ключевые функции

1. Управление парковками — CRUD локаций (имя, координаты, статус, Telegram chat IDs)
2. Управление ANPR-камерами — привязка к парковке, IP, MAC, направление (in/out)
3. Журнал проездов — события от камер с фото, номером, направлением, временем
4. Тарифы — ценообразование по типу (flat/hourly/slot), слоты по дням/часам
5. История тарифов — какой тариф применялся к парковке с какой даты
6. Аудит — полный лог изменений (кто/что/когда)
7. Управление пользователями + RBAC по меню
8. Telegram-интеграция — уведомления о проездах, Web App для просмотра
9. Мультиязычность: рус / узб / узб (кирилл) / eng
