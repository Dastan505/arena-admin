# Добавление поля price_per_player в Directus

## Быстрый способ (через Directus UI)

1. **Откройте Directus Admin**: https://directus.arena-api.ru/admin

2. **Перейдите в Data Model**:
   - Settings (⚙️) → Data Model
   - Найдите коллекцию `games`
   - Кликните на неё

3. **Добавьте поле**:
   - Нажмите кнопку **"Create Field"** (или "+" рядом с Fields)
   - Выберите тип: **Number**
   - Настройки:
     - **Key**: `price_per_player`
     - **Label**: "Цена за человека"
     - **Type**: Integer
     - **Required**: No (необязательное)
     - **Note**: "Цена за одного игрока в тенге"

4. **Сохраните** (Save)

## Через API скрипт

Если у вас есть admin token:

```bash
set DIRECTUS_ADMIN_TOKEN=your_admin_token_here
node scripts/add-price-field.js
```

## Проверка

После добавления поля, проверьте что API его возвращает:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://directus.arena-api.ru/items/games?fields=id,name,price_per_player
```

## Настройка прав доступа

После создания поля, нужно дать права роли `branch-admin`:

1. Settings → Access Control
2. Выберите роль **branch-admin**
3. Для коллекции **games** проверьте что включено **Read** и **Update**
4. В полях (Field Permissions) должно быть доступно поле `price_per_player`

## Что делать если не работает

1. **Ошибка 401/403** - проверьте что токен действительный
2. **Поля нет в ответе** - проверьте что поле создано и есть права доступа
3. **Цена не считается** - проверьте что `price_per_player` заполнено у игры

## Временное решение без поля

Если не можете сейчас добавить поле, система будет работать без авто-расчета цены - поле "Итого" останется пустым для ручного ввода.
