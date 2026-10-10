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

## Gates — `/api/gates`

Ворота локации. Камеры въезда и выезда одних ворот работают совместно
(`server/modules/gates/gateCooperation.service.js`, воркер `gateCooperationWorker`).

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/gates` | да | Список ворот (фильтры: location_id, status, search) |
| GET | `/gates/:id` | да | Ворота по ID |
| POST | `/gates` | да | Создать ворота (name, location_id, coop_enabled, coop_window_sec, maneuver_window_sec) |
| PUT | `/gates/:id` | да | Изменить ворота |
| DELETE | `/gates/:id` | да | Удалить ворота (камеры остаются, gate_id → null) |

**Камеры ворот работают командой.** Камеры въезда и выезда одних ворот (`gate_id`) — партнёры. Событие камеры
принимается всегда, без фильтра по направлению. Въезд или выезд определяют данные камеры (машина едет на камеру →
направление камеры, от камеры → обратное; `utils/passDirection.js`), а после сохранения — анализ AI.
- Обе камеры ворот записали один и тот же проезд (`coop_window_sec`) → одна запись, `gate_confirmed = true`, рейтинг +15 (лучший случай).
- Камера записала проезд в направлении, противоположном своему (камера выхода записала въезд, а камера входа пропустила) →
  `inferred = true`: «камера помогла партнёру». Если партнёр потом подтвердит — пометка снимается.
- Манёвр (машина только что проехала у этой камеры и сдаёт назад, `maneuver_window_sec`) проездом не считается.
- Выезд без въезда или повторный въезд в истории номера помечаются `history_conflict`, проезд не теряется.
У локации может быть одни или несколько ворот; пары камер определяются воротами, история номера — локацией.

## ANPR Cameras — `/api/anpr-cameras`

| Method | Path | Auth | Описание |
|--------|------|------|---------|
| POST | `/anpr-cameras/events` | нет | Webhook от ANPR-камеры (multipart/form-data) |
| GET | `/anpr-cameras` | да | Список камер (фильтры: parking_id, direction, status) |
| GET | `/anpr-cameras/:id` | да | Камера по ID |
| POST | `/anpr-cameras` | да | Создать камеру |
| PUT | `/anpr-cameras/:id` | да | Обновить |

**POST /anpr-cameras/events** — ключевой endpoint, принимает события от камер:
- Multipart form data с фото (file) и данными номерного знака
- Сохраняет запись в `vehicle_passes`
- Добавляет уведомление в `notifications_outbox` (для Telegram chat_ids парковки)


---

## AI Training — `/api/ai-training`

Выгрузка кадров для дообучения AI на локальном компьютере (`ai-service/ft pull`). Доступ: вход пользователя (страница админки «Дообучение AI», `/ai-training`) **или** токен
`AI_TRAINING_TOKEN` из `server/.env` (`Authorization: Bearer <token>`, для скрипта `ft pull`, у которого нет сессии).
Кадры сохраняет `utils/trainingFrames.js` (оригинал без сжатия + json) в `uploads/ai-training/<дата>/`, наружу статикой не отдаются.

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/ai-training/summary` | вход/токен | Сколько кадров накоплено по дням |
| GET | `/ai-training/plan?after=&until=&from=&to=&limit=` | вход/токен | Что скачается: `{count, first_id, last_id, has_more}`, без скачивания |
| GET | `/ai-training/export?after=<id>&until=<id>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&limit=200` | вход/токен | zip `frames/<id>.jpg` + `frames/<id>.json`, кадры строго после курсора `after` (макс. 500). Заголовки `X-Last-Id` (новый курсор), `X-Has-More`, `X-Count`; `204` — новых нет |

Что сохраняется (`reasons` в json): `side_conflict`, `plate_conflict`, `low_confidence`, `ai_missed`, `random_control` (случайные согласованные).
Настройки: `AI_TRAINING_DIR` (`off` — не сохранять), `AI_TRAINING_RANDOM_RATE` (0.05), `AI_TRAINING_LOW_CONF` (70), `AI_TRAINING_LOW_SIDE` (0.7), `AI_TRAINING_MAX_PER_DAY` (1000).
---

## Vehicle Passes — `/api/vehicle-passes`

| Method | Path | Auth | Описание |
|--------|------|------|---------|
| GET | `/vehicle-passes/image/*` | photo | Фото проезда (облегчённая auth) |
| GET | `/vehicle-passes` | да | Список проездов (фильтры: date_from, date_to, parking_id, plate_number, direction, history_conflict=true — только проезды с конфликтом истории номера; страница `/history-conflicts`) |
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
