# Worklog

## 2026-02-04
- Исправлен билд (убраны импорты CSS FullCalendar из `components/timeline-view.tsx`).
- Главная страница переведена на `Suspense` (вынесена в `app/home-view.tsx`, обёртка в `app/page.tsx`).
- В `/schedule` подключены модалки создания/просмотра брони, загрузка игр.
- Добавлены страницы-заглушки настроек: `/settings/arenas`, `/settings/payments`, `/settings/system`.
- Настроен systemd‑сервис `arena-admin` и proxy Nginx для `admin.arena-api.ru`.
- Добавлен скрипт бэкапа Postgres и инструкция в `docs/PROJECT_NOTES_RU.md`.
- Добавлен чеклист безопасности Directus в `docs/PROJECT_NOTES_RU.md`.
- Зафиксированы коллекции Directus, роли и политики доступа.
- Добавлен список ключевых страниц админки.
- Зафиксировано, что `api-access`/`scheduler-read` без явных permissions; нужно настроить и перепроверить админ‑доступ.
- Зафиксировано: `scheduler-read` имеет избыточные права (full CRUD на user‑коллекции и доступ к `directus_*`).
- Исправлено: `scheduler-read` оставлен только на read по нужным коллекциям, системные отключены.
