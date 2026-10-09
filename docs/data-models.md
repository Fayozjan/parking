# Data Models

**Обновлено:** 2026-06-08

Источник правды: `server/prisma/schema.public.prisma`

## Схема базы данных

Одна схема `public` — нет multi-tenant, все таблицы в одной PostgreSQL-схеме.

---

## users

Системные пользователи (веб + Telegram).

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| username | String unique | Логин |
| password | String | bcrypt hash |
| telegram_id | String? unique | Telegram user ID |
| first_name / last_name | String? | Имя |
| avatar | String? | Путь к аватару |
| status | Boolean | Активен? |
| language | String | Язык интерфейса (ru/uz/uzCyrl/en) |
| theme | String | Тема (light/dark) |
| sidebar | String | Состояние сайдбара (opened/closed) |
| settings | Json? | Дополнительные настройки |
| added_at | Timestamptz | |

---

## sessions

JWT refresh tokens.

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | |
| refresh_token | String | |
| ip_address | String? | |
| user_agent | String? | |
| added_at | Timestamptz | |
| expires_at | Timestamptz? | |
| user_id | FK → users | |

---

## menus

Иерархия меню для RBAC.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| name | String unique | Название пункта |
| path | String? | URL путь |
| parent_id | FK → menus? | Родительский пункт (null = корень) |
| sort_order | Int | Порядок сортировки |
| module | String? | Имя модуля |

---

## user_menu_access

Права пользователя на пункт меню.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| user_id | FK → users | |
| menu_id | FK → menus | |
| can_view | Boolean | |
| can_add | Boolean | |
| can_update | Boolean | |
| can_delete | Boolean | |

Уникальный индекс: `(user_id, menu_id)`

---

## parkings

Парковочные объекты.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| name | String? | Название парковки |
| telegram_chat_ids | String[] | Telegram chat IDs для уведомлений |
| status | Boolean? | Активна? |
| latitude / longitude | Float? | Координаты |
| added_at / updated_at | Timestamptz | |

Связи: `cameras` (anpr_cameras[]), `vehiclePasses` (vehicle_passes[]), `parkingTariffHistory`

---

## anpr_cameras

ANPR-камеры, привязанные к парковкам.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| name | String? | Название камеры |
| parking_id | FK → parkings | |
| camera_ip | String unique | IP адрес камеры |
| mac_address | String? unique | MAC адрес |
| port | Int? | HTTP порт (default: 80) |
| direction | String? | Направление: `in` / `out` |
| movement_direction | String? | УСТАРЕЛО, не используется: события принимаются все; колонка осталась в БД |
| username / password | String? | Кредентиалы камеры |
| status | Boolean? | Активна? |
| added_at / updated_at | Timestamptz | |

События камеры не фильтруются по направлению движения: принимается каждое, а въезд/выезд определяют
данные камеры и анализ AI (см. `docs/api-endpoints.md`, «Камеры ворот работают командой»).

При удалении парковки — камеры каскадно удаляются (`onDelete: Cascade`).

---

## vehicle_passes

События проездов от ANPR-камер.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| parking_id | FK → parkings | |
| camera_id | FK → anpr_cameras? | Может быть null если камера удалена |
| plate_number | String(20) | Распознанный номерной знак |
| direction | String? | `in` / `out` |
| photo | String? | Путь к файлу фото |
| date | Timestamptz | Время события (от камеры) |
| created_at | Timestamptz | Время сохранения в БД |
| plate_original | String(20)? | Номер камеры до исправления по AI (null — не менялся) |
| plate_conflict | Boolean | Камера и AI прочитали разные номера, решить не удалось — нужна проверка вручную |
| direction_source | String(10)? | Откуда направление: `camera` / `ai` / `default` (камера не сообщила движение) |
| direction_original | String(10)? | Направление до исправления по AI (null — не менялось) |
| history_conflict | Boolean | Выезд без въезда или повторный въезд в истории номера — проверить вручную |

Фото хранится по пути: `uploads/vehicle-passes/{year}/{month}/`

### Сверка с AI (camera_logs)

После сохранения проезда кадр сверяется с ai-service в фоне; результат пишется в `camera_logs`:
`ai_plate`, `ai_confidence`, `ai_direction`, `plate_consensus` (`agree` | `camera` | `ai` | `known` | `conflict` | `ai_no_plate` | `ai_unavailable`),
`direction_consensus` (`agree` | `camera` | `ai` | `none`). Правила — `server/utils/plateConsensus.js`.

---

## parking_tariffs

Тарифные планы.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| name | String(255) | Название тарифа |
| price_type | String(20) | Тип: `flat` / `hourly` / `slot` |
| base_price | Decimal(12,2)? | Базовая цена |
| effective_from | Date | Дата начала действия |
| is_active | Boolean | |
| added_at | Timestamptz | |
| added_by | FK → users | |

---

## parking_tariff_slots

Ценовые слоты внутри тарифа.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| tariff_id | FK → parking_tariffs | Каскадное удаление |
| day_of_week | Int? | День недели (1=Пн, 7=Вс), null = все дни |
| hour_from / hour_to | Int? | Часы (0–23), null = весь день |
| price | Decimal(12,2) | Цена за слот |

---

## parking_tariff_history

История назначения тарифов на парковки.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| parking_id | FK → parkings | Каскадное удаление |
| tariff_id | FK → parking_tariffs | |
| assigned_at | Date | Дата назначения |
| added_by | FK → users | |

Индекс: `(parking_id, assigned_at)`

---

## audit_logs

Журнал изменений всех сущностей.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| entity | String(100) | Имя модели (`parkings`, `anpr_cameras`, ...) |
| record_id | Int? | ID изменённой записи |
| action | String(20) | `create` / `update` / `delete` |
| old_data | Json? | Состояние до изменения |
| new_data | Json? | Состояние после изменения |
| user_id | FK → users? | |
| added_at | Timestamptz | |

Индексы: `entity`, `user_id`, `added_at`

---

## notifications_outbox

Очередь Telegram-уведомлений.

| Поле | Тип | Описание |
|------|-----|---------|
| id | Int PK | |
| source_type | Enum | `anpr_pass` |
| event_date | Timestamptz | Время события |
| chat_id | String(255) | Telegram chat ID |
| payload | Json | Данные для сообщения (plate, photo, direction, parking) |
| status | String(50) | `pending` / `sent` / `failed` |
| error | String? | Текст ошибки при неудаче |
| retry_count | Int | Количество попыток |
| created_at / updated_at | Timestamptz | |

Индекс: `(status, event_date)`

---

## Диаграмма связей (кратко)

```
users ──────────────────────────────────── sessions
  │                                          
  ├── user_menu_access ── menus
  ├── audit_logs
  ├── parking_tariffs ── parking_tariff_slots
  └── parking_tariff_history

parkings ── anpr_cameras ── vehicle_passes
  │
  └── parking_tariff_history ── parking_tariffs

notifications_outbox (async, от vehicle_passes событий)
```
