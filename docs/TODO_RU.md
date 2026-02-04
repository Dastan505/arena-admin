# TODO

## Ближайшие задачи
- Проверить права/роли Directus для безопасности
- Настроить явные permissions для `api-access` и `scheduler-read`
- Перепроверить админ‑доступ у `scheduler-read` (есть расхождение со скрином)
- Добавить `NEXT_TELEMETRY_DISABLED=1` на сервере
- Решить: запускать `standalone` или оставляем `next start`

## Оптимизация
- Убрать неиспользуемые зависимости
- Рассмотреть `output: "standalone"` для Next.js
- Проверить логи и метрики CPU/RAM на VPS

## Документация
- Обновить `docs/WORKLOG.md` после каждого деплоя
- Дописать инструкции восстановления сервера

## Сделано
- Авто‑деплой (GitHub Actions) — secrets настроены, workflow работает
- Описаны бэкапы БД и добавлен скрипт `scripts/backup-postgres.sh`
- Подготовлен список ключевых страниц админки
- `scheduler-read` ограничен до read‑only, доступ к `directus_*` выключен
- `api-access` ограничен до user‑коллекций, доступ к `directus_*` выключен
- Cron для ежедневных бэкапов настроен (03:15, log: `/var/log/pg_backup.log`)
