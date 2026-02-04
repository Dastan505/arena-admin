# Arena Admin — картина проекта

## 1) Что у нас есть
- **Локальная разработка**: `C:\projects\arena-admin`
- **Репозиторий**: GitHub `Dastan505/arena-admin`
- **VPS**: Ubuntu 22.04, IP `194.87.104.180`
- **Домен админки**: `admin.arena-api.ru`
- **Directus**: `directus.arena-api.ru`
- **Приложение**: Next.js (админка)
- **БД**: Postgres в Docker (контейнер `directus-postgres`)
  - DB_CLIENT: `pg`
  - DB_HOST: `postgres` (docker network)
  - DB_PORT: `5432`
  - DB_DATABASE: `directus`
  - DB_USER: `directus`
- **База данных**: Postgres (через Directus)

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

## 4.1) Авто‑деплой (GitHub Actions)
- Workflow: `.github/workflows/deploy.yml`
- Нужные secrets в GitHub:
  - `VPS_HOST` (например: `194.87.104.180`)
  - `VPS_USER` (например: `root`)
  - `VPS_PORT` (например: `22`)
  - `VPS_SSH_KEY` (приватный SSH‑ключ)
- После настройки secrets каждый `git push` в `main` делает деплой.

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

## 6) Бэкапы базы (Postgres в Docker)
Скрипт: `scripts/backup-postgres.sh`

### Один раз вручную
```bash
cd /root/arena-admin
bash scripts/backup-postgres.sh
```

### Автоматически по cron (каждую ночь в 03:15)
```bash
sudo crontab -e
```
Добавить строку:
```
15 3 * * * /bin/bash /root/arena-admin/scripts/backup-postgres.sh >> /var/log/pg_backup.log 2>&1
```

### Восстановление из бэкапа
```bash
gunzip -c /root/backups/postgres/directus_YYYY-MM-DD_HH-MM-SS.sql.gz | \
  docker exec -i directus-postgres psql -U directus -d directus
```

### Параметры (если нужны другие)
Можно переопределять переменные:
```
BACKUP_DIR=/root/backups/postgres
DB_CONTAINER=directus-postgres
DB_USER=directus
DB_NAME=directus
RETENTION_DAYS=14
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

## 8) Соглашения работы (на будущее)
- Если нужно добавить строку/настройку — давать команду в одну строку (append).
  - Linux пример: `echo "строка" >> файл`
  - PowerShell пример: `Add-Content -Path файл -Value "строка"`
- Для каждого изменения, если нужно отправлять в Git, указывать локальные команды:
  - `git add ...`
  - `git commit -m "..."`
  - `git push`

## 9) Directus: безопасность и роли (чеклист)
### 9.1 Роли и доступы
- Проверить роли в Directus: **Settings → Roles & Permissions**.
- Роль **Public** должна иметь доступ = **None** ко всем коллекциям.
- Роль **Admin** — полный доступ.
- Если нужны операторы/менеджеры — создать отдельные роли с минимальными правами.

### 9.2 Токены
- `DIRECTUS_SERVICE_TOKEN` хранится только на сервере в `.env.local`.
- Токен не попадает в клиентский код (используется только в API‑роутах).
- Рекомендуется периодически менять токен.

### 9.3 Что фиксируем в документации
- Список ролей (название + назначение).
- Какие коллекции доступны каждой роли.
- Кто владелец/ответственный за токен.
