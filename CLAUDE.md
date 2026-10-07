# OnBase Parking System — Claude Context

Полная документация: `docs/`

## Быстрый старт

| Задача | Читать |
|--------|--------|
| Новая страница / компонент | `docs/coding-rules.md` → "Паттерн страницы" |
| Найти файл | `docs/folder-structure.md` |
| Новый API эндпоинт | `docs/api-endpoints.md` + `docs/coding-rules.md` |
| Работа с БД | `docs/data-models.md` |
| Общий контекст проекта | `docs/project-overview.md` |

## Ключевые соглашения (кратко)

- **Backend**: ESM, модульная структура `server/modules/<name>/`, Prisma через `prismaPublic` (один клиент, без multi-tenant)
- **Frontend**: React 18 + Vite, Zustand, SCSS Modules, i18next
- **Стили страниц**: CSS Module классы (`styles.page`, `styles.main`, `styles.mainHeader`, `styles.tableContainer`, `styles.table`) — не inline styles
- **Permissions**: `usePermissions(currentPath)` → `can_add`, `can_update`, `can_delete`
- **Alerts**: `useAlertStore()` → `showAlert(message, type)`
- **Все тексты**: через `t('key')` из `useTranslation()`

## Структура проекта

```
OnBase - Parking/
├── client/          — React SPA (Vite, port 5000)
├── server/          — Node.js Express API (port 7000)
└── docs/            — Документация
```

## Модули сервера (8 штук)

| Маршрут | Модуль |
|---------|--------|
| `/api/auth` | auth |
| `/api/users` | users |
| `/api/menus` | menus |
| `/api/parkings` | parkings |
| `/api/anpr-cameras` | anprCameras |
| `/api/vehicle-passes` | vehiclePasses |
| `/api/parking-tariffs` | parkingTariffs |
| `/api/audit-logs` | auditLogs |

## Ключевой поток данных

```
ANPR Камера → POST /api/anpr-cameras/events (без auth) → vehicle_passes + notifications_outbox
```
