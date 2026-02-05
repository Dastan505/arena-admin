# Техническое задание: Arena Admin

## Архитектура системы

### Backend (уже развернут, НЕ трогать)
- **Directus CMS** (https://directus.arena-api.ru)
- PostgreSQL база данных
- Авторизация: JWT (access + refresh tokens)
- Роли: `admin`, `branch-admin` (через Access Policies)

### Frontend (нужно разработать)
- **Next.js 15+** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Любые UI-библиотеки** на выбор разработчика

---

## Обязательный функционал

### 1. Авторизация
```
POST /api/auth/login    - вход по email/password
POST /api/auth/logout   - выход
GET  /api/auth/me       - текущий пользователь
```
- JWT токены в httpOnly cookies
- Авто-refresh при 401
- Редирект на /login если не авторизован

### 2. Управление аренами
```
GET /api/arenas
```
- Пользователь с ролью `branch-admin` видит только свою арену
- Админ видит все арены

### 3. Расписание (КЛЮЧЕВОЙ ЭКРАН)
```
GET /api/bookings?start=YYYY-MM-DD&end=YYYY-MM-DD&arenaIds=X
POST /api/bookings
PATCH /api/bookings/:id
DELETE /api/bookings/:id
```

#### Требования к отображению:
- **Визуальная шкала времени** (вертикальная, как Google Calendar)
- Время: 07:00 - 23:00
- Бронирования отображаются блоками
- Позиция блока = время начала
- Высота блока = длительность
- Цвета по статусам:
  - `new` - синий
  - `confirmed` - зеленый  
  - `cancelled` - красный/серый

#### Создание брони:
- Клик на пустое место → открыть форму
- Поля: игра, время, длительность, режим (private/open), кол-во игроков, цена, имя клиента, телефон
- **Авто-расчет цены**: `price_per_player × количество_игроков`

### 4. Управление играми (настройки)
```
GET    /api/games
POST   /api/games
PATCH  /api/games/:id
DELETE /api/games/:id
```
- Поля игры: `name`, `duration_min`, `max_players`, `price_per_player`, `category`, `active`

---

## Схема данных Directus (готовая)

### Коллекция: `games`
```typescript
{
  id: number
  name: string           // название игры
  duration_min: number   // длительность в минутах
  max_players: number    // макс. игроков
  price_per_player: number  // цена за человека
  category: string       // категория (для группировки)
  active: boolean        // активна ли
}
```

### Коллекция: `bookings`
```typescript
{
  id: number
  arena: number          // ID арены (many-to-one → arenas)
  game: number           // ID игры (many-to-one → games)
  client: number         // ID клиента (many-to-one → clients)
  date: string           // YYYY-MM-DD
  start_time: string     // HH:mm:ss
  duration: number       // в минутах
  status: string         // 'new' | 'confirmed' | 'cancelled'
  mode: string           // 'private' | 'open'
  players: number        // кол-во игроков
  price_total: number    // итоговая цена
  comment: string        // комментарий
}
```

### Коллекция: `clients`
```typescript
{
  id: number
  name: string
  phone: string
  arena: number          // привязка к арене
}
```

### Коллекция: `arenas`
```typescript
{
  id: number
  name: string
  address: string
}
```

### Коллекция: `directus_users`
```typescript
{
  // стандартные поля Directus + кастомное:
  arena: number          // ID арены для branch-admin
}
```

---

## API Endpoints (готовые на сервере)

Все endpoints возвращают JSON.

### Auth
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: {...} }

POST /api/auth/logout
GET  /api/auth/me
```

### Arenas
```
GET /api/arenas
Response: [{ id, name, address }]
```

### Games
```
GET    /api/games
POST   /api/games          { name, category, price_per_player }
PATCH  /api/games/:id      { name?, category?, price_per_player? }
DELETE /api/games/:id
```

### Bookings
```
GET /api/bookings?start=YYYY-MM-DD&end=YYYY-MM-DD&arenaIds=1,2
Response: [{
  id: string,
  title: string,
  start: "2026-02-06T15:05:00",
  end: "2026-02-06T16:05:00",
  resourceId: "1",  // ID арены
  extendedProps: {
    status: "new",
    clientName: "...",
    gameName: "...",
    date: "2026-02-06",
    startTime: "15:05",
    duration: 60
  }
}]

POST /api/bookings
Body: {
  arena: number,
  date: "YYYY-MM-DD",
  start_time: "HH:mm",
  durationMinutes: number,
  game?: number,
  players?: string,
  price?: string,
  mode?: "private" | "open",
  clientName?: string,
  phone?: string,
  comment?: string
}

PATCH /api/bookings/:id
Body: { status?: "cancelled" | "confirmed", ... }

DELETE /api/bookings/:id
```

---

## Права доступа (уже настроены в Directus)

**Роль `branch-admin` (через Access Policies):**
- `games`: Read (все поля)
- `bookings`: Create, Read, Update (своя арена)
- `clients`: Create, Read
- `arenas`: Read (только своя)

**Роль `admin`:**
- Полный доступ

---

## Технические требования

1. **SSR/CSR**: Использовать "use client" где нужен интерактив
2. **Типизация**: Все TypeScript интерфейсы должны соответствовать схеме Directus
3. **Обработка ошибок**: 401 → редирект на login, 403 → показать сообщение
4. **Авто-обновление токена**: При 401 делать refresh и retry запроса
5. **Защита роутов**: Middleware проверяет авторизацию

---

## Интеграция с существующим сервером

### Env переменные
```env
DIRECTUS_URL=https://directus.arena-api.ru
DIRECTUS_SERVICE_TOKEN=...  // опционально, для fallback
```

### Куки (устанавливаются при login)
- `da_access_token` - JWT access token
- `da_refresh_token` - JWT refresh token

### Headers для API
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Что НЕ входит в ТЗ (придумать самому)

1. Визуальный дизайн (цвета, шрифты, анимации)
2. UX-улучшения (drag-and-drop, горячие клавиши)
3. Дополнительные фичи (статистика, отчеты)
4. Мобильная адаптация (можно базовую)
5. Выбор технологий для календаря (свой код или библиотека)

---

## Минимальный MVP

1. ✅ Авторизация
2. ✅ Просмотр расписания (шкала времени)
3. ✅ Создание брони с формой
4. ✅ Просмотр деталей брони
5. ✅ Отмена/удаление брони
6. ✅ Управление играми (CRUD)

---

## Проверка готовности

```bash
# Должно работать:
1. Логин → редирект на расписание
2. Видны бронирования (если есть в Directus)
3. Клик на пустое место → создание брони
4. Клик на бронь → детали
5. Создание брони → появляется на шкале
6. Выход → редирект на логин
```

---

## Контакты для вопросов

API база: https://directus.arena-api.ru
Админка: https://directus.arena-api.ru/admin
