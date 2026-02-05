# Пошаговая диагностика и настройка

## Шаг 1: Проверьте что price_per_player возвращается API

Откройте консоль браузера (F12) и выполните:
```javascript
// Проверим что приходит с API игр
fetch('/api/games')
  .then(r => r.json())
  .then(data => {
    console.log('Игры:', data);
    data.forEach(g => {
      console.log(`${g.name}: ${g.price_per_player} ₸`);
    });
  });
```

**Если `price_per_player` = null** - поле не заполнено в Directus
**Если поля нет в ответе** - проблема с правами доступа

## Шаг 2: Проверьте права доступа (через Directus UI)

1. Зайдите: https://directus.arena-api.ru/admin
2. **Settings → Access Control**
3. Выберите роль **branch-admin**
4. Проверьте таблицу:

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| bookings   | ✅     | ✅   | ✅     | -      |
| clients    | ✅     | ✅   | -      | -      |
| games      | -      | ✅   | -      | -      |

**Если нет галочек** - кликните на коллекцию и включите нужные права.

## Шаг 3: Проверьте поле arena у пользователя

1. **Settings → Users**
2. Найдите вашего пользователя (branch-admin)
3. Проверьте поле **Arena** - оно должно быть заполнено

Если поля Arena нет:
1. Settings → Data Model → directus_users
2. Create Field → Many-to-One
3. Key: `arena`
4. Related Collection: `arenas`

## Шаг 4: Заполните цены у игр

1. Content → games
2. Откройте каждую игру
3. Заполните поле **Price Per Player** (например: 5000)
4. Save

## Быстрые команды для проверки

### Проверка через curl (Windows PowerShell):
```powershell
# 1. Получить токен
$login = curl -X POST "https://directus.arena-api.ru/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"ваш_email","password":"ваш_пароль"}' | ConvertFrom-Json

$token = $login.data.access_token

# 2. Проверить игры
curl -H "Authorization: Bearer $token" `
  "https://directus.arena-api.ru/items/games?fields=id,name,price_per_player"

# 3. Проверить права на bookings
curl -X POST "https://directus.arena-api.ru/items/bookings" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"arena":"ваша_арена_id","date":"2026-02-06","start_time":"12:00","duration":60}'
```

## Частые ошибки

### "Failed to load games" (500)
**Причина**: API не может получить доступ к Directus
**Решение**: Проверьте DIRECTUS_SERVICE_TOKEN в .env.local или перезапустите dev сервер

### "Ошибка создания брони" (403) - РЕШЕНО
**Причина**: Нет прав на создание в bookings или clients
**Решение**: 
1. Settings → **Access Policies** (не Access Control!)
2. Выберите политику **branch-access**
3. Для коллекций `bookings` и `clients` включите: **Create**, **Read**, **Update**
4. Убедитесь что в Field Permissions включены все поля

**Важно:** В новых версиях Directus права настраиваются через **Access Policies**, а не через Access Control → Roles.

### Цена не считается (0 ₸)
**Причина**: Поле price_per_player пустое или не возвращается API
**Решение**: 
1. Заполните цены в Content → games
2. Проверьте что поле доступно для чтения роли branch-admin

## Что проверить прямо сейчас

Ответьте на вопросы:
1. ✅ Поле price_per_player есть в коллекции games?
2. ✅ У игр заполнены цены?
3. ✅ Роль branch-admin имеет право Read на games?
4. ✅ Роль branch-admin имеет право Create на bookings?
5. ✅ Роль branch-admin имеет право Create на clients?
6. ✅ У пользователя заполнено поле arena?

Если все ✅ - бронирование должно работать!
