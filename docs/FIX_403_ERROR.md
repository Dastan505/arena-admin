# Исправление ошибки 403 при создании бронирования

## Проблема

При создании бронирования через `POST /api/bookings` возникает ошибка:
```
Directus error 403: {"errors":[{"message":"You don't have permission..."}]}
```

## Причина

Роль `branch-admin` в Directus не имеет прав на создание записей в коллекциях:
- `bookings` (бронирования)
- `clients` (клиенты)

## Решение

### Вариант 1: Настроить права в Directus (рекомендуется)

Запустите скрипт настройки permissions:

```bash
set DIRECTUS_ADMIN_TOKEN=your_admin_token
node scripts/setup-bookings-permissions.js
```

Этот скрипт:
1. Найдет роль `branch-admin`
2. Создаст permissions для actions: `create`, `read`, `update`
3. Настроит фильтр: пользователь может работать только с записями своей арены

### Вариант 2: Fallback на Service Token (уже реализовано)

В `app/api/bookings/route.ts` добавлен fallback механизм:

```typescript
// Try with user token first, fallback to service token on 403
let created;
try {
  created = await directusFetchWithToken(token, `/items/bookings`, {...});
} catch (error) {
  if (error.status === 403 && DIRECTUS_TOKEN) {
    // Fallback to service token
    created = await directusFetch(`/items/bookings`, {...});
  }
}
```

Требования:
- `DIRECTUS_SERVICE_TOKEN` должен быть настроен в `.env.local`
- Токен должен иметь права на создание записей в `bookings` и `clients`

## Проверка настроек Directus

### 1. Проверить поле arena в users

У пользователей с ролью `branch-admin` должно быть заполнено поле `arena`.

Проверка через API:
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://directus.arena-api.ru/users?fields=id,email,role.name,arena
```

### 2. Проверить permissions

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://directus.arena-api.ru/permissions?filter[collection][_eq]=bookings
```

### 3. Ручная настройка (если скрипт не сработал)

1. Открыть Directus Admin: https://directus.arena-api.ru/admin
2. Settings → Access Control
3. Выбрать роль `branch-admin`
4. Для коллекции `bookings` добавить:
   - **Create**: ✅ Full Access
   - **Read**: ✅ Full Access + Item Filter: `{"arena":{"_eq":"$CURRENT_USER.arena"}}`
   - **Update**: ✅ Full Access + Item Filter: `{"arena":{"_eq":"$CURRENT_USER.arena"}}`
5. Для коллекции `clients` добавить:
   - **Create**: ✅ Full Access
   - **Read**: ✅ Full Access

## Проверка работы

После настройки протестируйте создание бронирования:

```bash
# Получить токен
TOKEN=$(curl -X POST https://arena.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"branch@example.com","password":"password"}' \
  | jq -r '.token')

# Создать бронирование
curl -X POST https://arena.your-domain.com/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "arena": "your-arena-id",
    "date": "2026-02-05",
    "start_time": "14:00",
    "durationMinutes": 60,
    "mode": "private"
  }'
```

## Связанные файлы

- `app/api/bookings/route.ts` - API endpoint с fallback логикой
- `scripts/setup-bookings-permissions.js` - Скрипт настройки прав
- `lib/directus.ts` - Service token функции
