# Настройка Directus для Arena Admin

## Текущая схема коллекции `games`

Поля:
- `id` - ID игры
- `name` - Название игры (обязательное)
- `duration_min` - Длительность в минутах (обязательное)
- `max_players` - Максимум игроков
- `price_per_player` - Цена за человека (Decimal)
- `category` - Категория игры
- `active` - Активна ли игра

## Что нужно проверить/настроить

### 1. Права доступа для роли `branch-admin`

Перейдите: Settings → Access Control → branch-admin

Проверьте для коллекции `games`:
- [ ] **Read** - должно быть включено ✅
- [ ] **Create** - опционально
- [ ] **Update** - опционально

Для коллекции `bookings`:
- [ ] **Create** - должно быть включено ✅
- [ ] **Read** - должно быть включено ✅
- [ ] **Update** - должно быть включено ✅

Для коллекции `clients`:
- [ ] **Create** - должно быть включено ✅
- [ ] **Read** - должно быть включено ✅

### 2. Проверка поля `arena` у пользователей

Перейдите: Settings → Data Model → directus_users

Проверьте что есть поле:
- **Key**: `arena`
- **Type**: Many-to-One (или Integer/String)
- **Related Collection**: `arenas`

### 3. Проверка заполнения данных

#### Игры с ценами:
Откройте коллекцию `games` и проверьте что у игр заполнено поле `price_per_player`.

Пример:
- Kernel: 5000 ₸
- Другие игры: свои цены

#### Пользователи с аренами:
Откройте Settings → Users, проверьте что у branch-admin пользователей заполнено поле `arena`.

## Быстрая проверка через API

### Получить игры с ценами:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://directus.arena-api.ru/items/games?fields=id,name,price_per_player,category
```

### Проверить права bookings:
```bash
# Создать бронирование
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "arena": "your-arena-id",
    "date": "2026-02-05",
    "start_time": "14:00",
    "duration": 60,
    "status": "new"
  }' \
  https://directus.arena-api.ru/items/bookings
```

## Устранение ошибок

### Ошибка 403 при создании брони
**Причина**: Нет прав на создание в `bookings` или `clients`

**Решение**:
1. Settings → Access Control → branch-admin
2. Добавьте permissions для `bookings` (Create, Read, Update)
3. Добавьте permissions для `clients` (Create, Read)

### Ошибка 401 при получении игр
**Причина**: Токен невалидный или истек

**Решение**: Перелогиньтесь в приложении

### Цена не считается автоматически
**Причина**: Поле `price_per_player` пустое или API не возвращает его

**Решение**:
1. Проверьте что поле заполнено в коллекции `games`
2. Проверьте что у роли есть право на чтение этого поля

## Скрипты для автоматизации

### Проверка конфигурации:
```bash
node scripts/check-directus-config.js
```

### Настройка permissions:
```bash
set DIRECTUS_ADMIN_TOKEN=your_token
node scripts/setup-bookings-permissions.js
```
