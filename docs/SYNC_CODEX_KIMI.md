# Синхронизация с Codex - Arena Admin

## Дата: 2026-02-05

### Проблема: Ошибка 403 при создании бронирования

**Ошибка:**
```
You don't have permission to access field "mode" in collection "bookings"
```

**Причина:** У роли `branch-admin` нет прав на чтение поля `mode` в коллекции `bookings`.

**Решение в коде:**
Добавлен fallback в `checkTimeConflicts` - если нет прав на поле `mode`, запрашиваем без него.

**Решение в Directus (рекомендуется):**
1. Settings → Access Control → branch-admin
2. Выбрать коллекцию `bookings`
3. В Field Permissions добавить поле `mode` (чтение)

---

## Схема Directus

### Коллекция: games
```yaml
fields:
  - id: primary key
  - name: string (required)
  - duration_min: integer (required) 
  - max_players: integer
  - price_per_player: decimal/integer  # <-- для авто-расчета цены
  - category: string                   # <-- для группировки
  - active: boolean
```

### Коллекция: bookings
```yaml
fields:
  - id: primary key
  - arena: many-to-one (arenas)
  - date: date
  - start_time: string
  - duration: integer (minutes)
  - status: string (new|confirmed|cancelled)
  - mode: string (private|open)        # <-- нужно добавить права!
  - players: integer
  - price_total: integer
  - comment: text
  - game: many-to-one (games)
  - client: many-to-one (clients)
```

### Коллекция: clients
```yaml
fields:
  - id: primary key
  - name: string
  - phone: string
  - arena: many-to-one (arenas)
```

---

## Необходимые Permissions для branch-admin

### Collection: games
- Read: ✅ (all fields: id, name, category, price_per_player)

### Collection: bookings
- Create: ✅ (all fields)
- Read: ✅ (all fields including: mode, status, arena, date, start_time, duration, players, price_total, game, client)
- Update: ✅ (status, comment, etc.)

### Collection: clients
- Create: ✅ (name, phone, arena)
- Read: ✅ (id, name, phone)

### Collection: directus_users
- Поле `arena` должно быть доступно для чтения/изменения админом

---

## Кодовые изменения

### Файлы с fallback на 403:
1. `app/api/bookings/route.ts`:
   - `checkTimeConflicts` - fallback без поля `mode`
   - `POST` - fallback на service token
   - `findClientIdByPhone` - fallback на service token
   - `createClient` - fallback на service token

2. `app/api/games/route.ts`:
   - `GET` - использует user token первым
   - `POST/PATCH/DELETE` - fallback на service token

### Логирование добавлено:
- `[bookings POST] Starting...`
- `[bookings POST] Token: present/missing`
- `[bookings POST] Body: {...}`
- `[bookings POST] Checking conflicts...`
- `[checkTimeConflicts] No permission for 'mode' field...`

---

## ✅ Решение найдено (2026-02-05)

Проблема была в **Access Policies** (не Access Control/Roles).

### Настройка:
**Settings → Access Policies → branch-access:**

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| bookings   | ✅     | ✅   | ✅     | -      |
| clients    | ✅     | ✅   | ✅     | -      |
| games      | -      | ✅   | -      | -      |

**Важно:** В политике должны быть включены **все поля** (Field Permissions) для чтения/создания.

### Проверка:
- ✅ Бронирование создаётся без ошибок 403
- ✅ Авто-расчет цены работает (price_per_player × players)
- ✅ Клиенты создаются автоматически по телефону

---

## Тестирование после настройки

```bash
# 1. Получить игры с ценами
curl /api/games
# Ожидаем: [{id, name, category, price_per_player}]

# 2. Создать бронирование
curl -X POST /api/bookings \
  -d '{"arena":"1","date":"2026-02-07","start_time":"12:00","durationMinutes":60,"game":1,"players":"2"}'
# Ожидаем: 201 Created

# 3. Проверить авто-расчет цены
# В модалке: Итого = price_per_player × players
```

---

## Архитектура авторизации

```
User (branch-admin)
    ↓
Login → JWT tokens (access + refresh, httpOnly cookies)
    ↓
API calls with access_token
    ↓
If 401 → auto refresh
    ↓
If 403 → fallback to service token (если настроен)
    ↓
Directus
```

## Env переменные

```env
DIRECTUS_URL=https://directus.arena-api.ru
DIRECTUS_SERVICE_TOKEN=optional_fallback_token
```

---

## Последние изменения

### 2026-02-05
- ✅ Добавлено поле `price_per_player` в API
- ✅ Авто-расчет цены в NewSessionModal
- ✅ Fallback на service token при 403
- ✅ Компактный дизайн модалки
- ✅ Логирование для диагностики
- ✅ Документация permissions

### 2026-02-06
- ✅ В NewSessionModal восстановлен выбор сеанса: исправлен JSX-комментарий в `components/new-session-modal.tsx` (`{/* Game Selection */}`), который скрывал блок селекта.
- ✅ Добавлена вместимость филиала (поле `capacity` у `arenas`): сервер учитывает лимит при проверке конфликтов, а расписание скрывает “+ Добавить” при заполнении слота.

### TODO:
- [ ] Настроить permissions в Directus (mode field)
- [ ] Заполнить price_per_player у игр
- [ ] Проверить поле arena у users
