# Coding Rules & Conventions

**Обновлено:** 2026-06-08

## Backend

### Структура модуля (обязательно)

Каждый новый домен = отдельная папка `server/modules/<name>/` с файлами:
- `<name>.routes.js` — Express Router
- `<name>.controller.js` — только req/res, без логики
- `<name>.service.js` — бизнес-логика
- `<name>.model.js` — запросы к БД через Prisma

Регистрация в `server/routes/index.js`.

### Middleware порядок в routes

```js
// Публичный endpoint (без auth):
router.post("/events", upload.any(), Controller.receiveEvent);

// Затем auth для всех остальных:
router.use(authMiddleware);
router.get("/", Controller.getAll);
```

### Prisma

Нет multi-tenant. Prisma-клиент импортируется напрямую:
```js
import { PrismaClient } from "../../prisma-clients/public/index.js";
const prisma = new PrismaClient();
```
Нет `req.prisma` — это паттерн из HR-системы, в этом проекте не используется.

### Именование

- Файлы: `camelCase.js` (последовательно внутри модуля)
- Классы контроллеров: `PascalCase` + суффикс `Controller` (`ParkingsController`)
- Функции сервиса: `camelCase` (`getAll`, `getById`, `create`, `update`, `delete`)
- Таблицы БД: `snake_case` множественное число (`parkings`, `vehicle_passes`)
- Поля БД: `snake_case` (`parking_id`, `plate_number`, `added_at`)

### ES Modules

Весь сервер использует ESM (`"type": "module"` в package.json). Всегда `import/export`, не `require/module.exports`.

### Error handling

Контроллеры оборачивают вызовы в try/catch, передают в `next(err)` или возвращают `res.status(xxx).json({ message })`.

### Auth

- Access token: 15 минут, в httpOnly cookie `access_token`
- Refresh token: 8 часов, в httpOnly cookie `refresh_token`
- Пароли: bcrypt hashing
- Camera webhook (`/anpr-cameras/events`): без авторизации

---

## Frontend

### Именование компонентов

- Файлы компонентов: `PascalCase.jsx` (`AnprCamerasPage.jsx`, `ParkingsPage.jsx`)
- CSS Modules: `PascalCase.module.scss` (рядом с компонентом)
- Хуки: `camelCase` с префиксом `use` (`usePermissions`, `useAuthCheck`)
- API файлы: `camelCase.js` по домену (`vehiclePasses.js`, `parkingTariffs.js`)
- Stores: `camelCase` + суффикс `Store` (`authStore`, `alertStore`)

### Структура компонента (паттерн)

```jsx
// 1. Импорты (react, хуки, компоненты, стили, api)
// 2. Компонент с деструктуризацией props
// 3. Хуки и состояние
// 4. Обработчики (handleSubmit, handleChange)
// 5. JSX return
```

### API вызовы

Все API вызовы через функции из `src/api/<module>.js`, не напрямую через axios.
```js
// Правильно:
import { getParkings } from '../api/parkings'
// Неправильно:
import api from '../api/instance'; api.get('/parkings')
```

### Стейт-менеджмент

- **Zustand** для глобального состояния (auth, alerts, filters, sidebar)
- **useState/useReducer** для локального состояния компонента

### Уведомления (alerts)

```js
const { showAlert } = useAlertStore()
showAlert('success', t('saved'))
showAlert('error', error.message)
```

### Переводы (i18n)

- Все видимые тексты через `t('key')` из `useTranslation()`
- Ключи добавлять во все 4 файла: `ru.json`, `uz.json`, `uzCyrl.json`, `en.json`
- Ключи: `camelCase` или `snake_case`, по смыслу (`parking.name`, `button.save`)

### Permissions (RBAC)

```jsx
const { can_add, can_update, can_delete } = usePermissions(location.pathname)
// Показывать кнопку "Добавить" только если can_add === true
```

### Dual UI (Web + Telegram)

- Веб-страницы: `src/pages/*Page.jsx` — используют `WebLayout`
- Telegram-страницы: `src/pages/*PageTelegram.jsx` — используют `TelegramLayout`

### Стилизация

- Предпочитать SCSS Modules (`.module.scss`) для стилей компонента
- Bootstrap классы для grid и простых утилит
- Глобальные переменные из `themes.scss`:
  - Фон: `--card-bg`, `--bg-light`, `--bg-color`
  - Текст: `--text-color`, `--text-secondary`
  - Границы: `--border-color`, `--border-subtle`
  - Инпуты: `--input-bg`
  - Акцент: `--third-color` (синий)
  - Типография: `--font-small`, `--font-body`, `--font-h1/h2/h3`
  - ⚠️ `--bg-primary`, `--bg-secondary`, `--text-primary`, `--primary` — **не существуют**
- Не использовать inline styles кроме динамических значений (цвет, ширина, opacity)
- Не использовать `color-mix()` в SCSS — парсер ломается на запятых внутри `var()`

### Паттерн страницы (Page Layout)

Все страницы с таблицами следуют единой структуре JSX и SCSS.

**Структура JSX:**
```jsx
<div className={styles.page}>
  {loading ? <Loading /> : (
    <div className={styles.main}>
      <div className={styles.mainHeader}>
        <div className={styles.filterWrapper}>
          <Search ... />
          {/* фильтры */}
        </div>
        <Pagination ... />
        <div className={styles.buttonsWrapper}>
          {can_add && <Button text={t("add")} onClick={...} />}
          <div className={styles.refreshBtn} onClick={fetchData}>{Icons.refresh}</div>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>...</th></tr></thead>
          <tbody>...</tbody>
        </table>
      </div>
    </div>
  )}
</div>
```

**Ключевые классы в SCSS:**
- `.page` — `height: 100vh`, flex column
- `.main` — `background: var(--card-bg)`, flex column, `height: 100%`
- `.mainHeader` — flex row, space-between, flex-wrap
- `.tableContainer` — `flex: 1`, `overflow: auto`, sticky-scroll
- `.table` — sticky thead, th uppercase 11px, tbody tr hover

### Модальные окна внутри OverlaySidebar

`OverlaySidebar` использует framer-motion `transform` → `position: fixed` дочерних элементов позиционируется относительно sidebar. Решение — рендерить модал через `createPortal`:

```jsx
import { createPortal } from "react-dom";
return createPortal(<div className={styles.overlay}>...</div>, document.body);
```

---

## Общие правила

### Языки

- Весь код: английский (переменные, функции, комментарии)
- Переводы UI: через i18n
- Документация: русский

### Git

- Ветки по фичам: `feat/<feature-name>`
- Коммиты: императив, кратко (`feat(parkings): add tariff history endpoint`)

### Формат дат

- Backend: хранить в UTC, `Timestamptz(6)` в Prisma
- Frontend: отображать через `dayjs` с учётом timezone (Ташкент, UTC+5)
- Даты событий камер: приходят от камеры — проверять формат перед сохранением
