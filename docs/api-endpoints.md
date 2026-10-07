# API Endpoints

**Обновлено:** 2026-06-08

Base URL: `/api`  
Auth: JWT в httpOnly cookie `access_token`. Маршруты без `*` требуют авторизации.

---

## Auth — `/api/auth`

| Method | Path | Описание |
|--------|------|---------|
| POST | `/auth/login` * | Вход (username, password) → JWT cookies |
| POST | `/auth/telegram` * | Telegram-вход (telegram_id) |
| POST | `/auth/logout` | Выход, очистка cookies |
| POST | `/auth/refresh` * | Обновление access_token по refresh_token |
| GET | `/auth/me` | Текущий пользователь + настройки |

---

## Parkings — `/api/parkings`

| Method | Path | Описание |
|--------|------|---------|
| GET | `/parkings` | Список парковок (фильтры: search, status) |
| GET | `/parkings/active` | Только активные (id + name) |
| GET | `/parkings/:id` | Парковка по ID |
| POST | `/parkings` | Создать парковку |
| PUT | `/parkings/:id` | Обновить |
| GET | `/parkings/:id/tariff-history` | История тарифов парковки |
| POST | `/parkings/:id/tariff-history` | Назначить тариф парковке |
| PUT | `/parkings/:parkingId/tariff-history/:historyId` | Обновить запись истории |
| DELETE | `/parkings/:parkingId/tariff-history/:historyId` | Удалить запись истории |

**Body для создания/обновления парковки:**
```json
{
  "name": "Парковка #1",
  "status": true,
  "latitude": 41.2995,
  "longitude": 69.2401,
  "telegram_chat_ids": ["-100123456789"]
}
```

---

## ANPR Cameras — `/api/anpr-cameras`

| Method | Path | Auth | Описание |
|--------|------|------|---------|
| POST | `/anpr-cameras/events` | нет | Webhook от ANPR-камеры (multipart/form-data) |
| GET | `/anpr-cameras` | да | Список камер (фильтры: parking_id, direction, movement_direction, status) |
| GET | `/anpr-cameras/:id` | да | Камера по ID |
| POST | `/anpr-cameras` | да | Создать камеру |
| PUT | `/anpr-cameras/:id` | да | Обновить |

**POST /anpr-cameras/events** — ключевой endpoint, принимает события от камер:
- Multipart form data с фото (file) и данными номерного знака
- Сохраняет запись в `vehicle_passes`
- Добавляет уведомление в `notifications_outbox` (для Telegram chat_ids парковки)

---

## Vehicle Passes — `/api/vehicle-passes`

| Method | Path | Auth | Описание |
|--------|------|------|---------|
| GET | `/vehicle-passes/image/*` | photo | Фото проезда (облегчённая auth) |
| GET | `/vehicle-passes` | да | Список проездов (фильтры: date_from, date_to, parking_id, plate_number, direction) |
| GET | `/vehicle-passes/:id` | да | Проезд по ID |
| PUT | `/vehicle-passes/:id` | да | Обновить запись |
| DELETE | `/vehicle-passes/:id` | да | Удалить запись |

**Примечание:** создание через UI не предусмотрено — записи создаются автоматически через `/anpr-cameras/events`.

---

## Parking Tariffs — `/api/parking-tariffs`

| Method | Path | Описание |
|--------|------|---------|
| GET | `/parking-tariffs` | Список тарифов |
| GET | `/parking-tariffs/:id` | Тариф по ID (включает слоты) |
| POST | `/parking-tariffs` | Создать тариф |
| PUT | `/parking-tariffs/:id` | Обновить тариф |
| DELETE | `/parking-tariffs/:id` | Удалить тариф |

**Body для создания тарифа:**
```json
{
  "name": "Базовый тариф",
  "price_type": "flat",
  "base_price": 5000,
  "effective_from": "2026-01-01",
  "slots": [
    { "day_of_week": 1, "hour_from": 8, "hour_to": 20, "price": 3000 }
  ]
}
```

`price_type`: `flat` (фиксированная), `hourly` (почасовая), `slot` (по слотам)

---

## Users — `/api/users`

| Method | Path | Описание |
|--------|------|---------|
| GET | `/users` | Список пользователей |
| GET | `/users/me` | Профиль текущего пользователя |
| PUT | `/users/me` | Обновить профиль (theme, language, sidebar) |
| GET | `/users/me/access` | Права доступа текущего пользователя |
| GET | `/users/menu` | Доступные меню (дерево) |
| GET | `/users/:id` | Пользователь по ID |
| POST | `/users` | Создать пользователя |
| PUT | `/users/:id` | Обновить пользователя |
| PUT | `/users/:id/avatar` | Загрузить аватар (multipart/form-data) |

---

## Menus — `/api/menus`

| Method | Path | Описание |
|--------|------|---------|
| GET | `/menus` | Дерево меню (иерархия) |
| POST | `/menus` | Создать пункт меню |
| PUT | `/menus/:id` | Обновить пункт |
| DELETE | `/menus/:id` | Удалить пункт |

---

## Audit Logs — `/api/audit-logs`

| Method | Path | Описание |
|--------|------|---------|
| GET | `/audit-logs` | Лог изменений (read-only, фильтры: entity, user_id, date_from, date_to) |
