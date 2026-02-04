# Arena Admin — картина проекта

## 1) Что у нас есть
- **Локальная разработка**: `C:\projects\arena-admin`
- **Репозиторий**: GitHub `Dastan505/arena-admin`
- **VPS**: Ubuntu 22.04, IP `194.87.104.180`
- **Домен админки**: `admin.arena-api.ru`
- **Directus**: `directus.arena-api.ru`
- **Приложение**: Next.js (админка)
- **База данных**: за Directus (тип уточнить: Postgres/MySQL и т.п.)

## 2) Архитектура (как всё связано)
```
Браузер
  ↓
Nginx (admin.arena-api.ru, HTTPS)
  ↓ proxy_pass
Next.js (порт 3000, systemd)
  ↓ API routes (/api/arenas, /api/bookings, /api/games)
Directus (directus.arena-api.ru, токен)
  ↓
База данных
```

## 3) Где что лежит (важные пути)
### Локально
- Проект: `C:\projects\arena-admin`
- Запуск: `pnpm dev` → http://localhost:3000

### Сервер
- Проект: `/root/arena-admin`
- Сервис: `/etc/systemd/system/arena-admin.service`
- Nginx сайт: `/etc/nginx/sites-available/arena-admin`
- Nginx enabled: `/etc/nginx/sites-enabled/arena-admin`
- ENV: `/root/arena-admin/.env.local`

## 4) Как правильно вносить изменения (пошагово)
### Локально
```powershell
cd C:\projects\arena-admin
pnpm install
pnpm dev
```
Тестируем в браузере → `http://localhost:3000`.

### Коммит и пуш
```powershell
git add .
git commit -m "описание изменений"
git push
```

### На сервере
```bash
ssh root@194.87.104.180
cd /root/arena-admin
git pull
pnpm install
pnpm build
sudo systemctl restart arena-admin
```

## 5) Полезные проверки
### Сервер
```bash
systemctl status arena-admin
journalctl -u arena-admin -e --no-pager
curl -I http://127.0.0.1:3000
```

### Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo tail -n 50 /var/log/nginx/error.log
```

## 6) Оптимизация (безопасные шаги)
- На сервере **никогда** не запускать `pnpm dev`.
- Добавить в `.env.local`:
  ```
  NEXT_TELEMETRY_DISABLED=1
  ```
- Периодически удалять неиспользуемые зависимости.
- Если FullCalendar больше не нужен — удалить из зависимостей и кода.
- Опционально: `output: "standalone"` в `next.config.ts` (ускорит старт и уменьшит сборку).

## 7) Что ещё надо уточнить/дополнить
- Тип БД (Postgres/MySQL), где хостится, как делать бэкапы.
- Политика хранения Directus токена.
- Авто‑деплой или ручной деплой (сейчас — ручной).

