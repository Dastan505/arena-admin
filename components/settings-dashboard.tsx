"use client";

import Link from "next/link";

export default function SettingsDashboard() {
  const cards = [
    { href: "/settings/games", title: "Игры", desc: "Управление доступными играми" },
    { href: "/settings/arenas", title: "Арены", desc: "Настройки и ресурсы арены" },
    { href: "/settings/payments", title: "Платежи", desc: "Интеграции и настройки платежей" },
    { href: "/settings/system", title: "Система", desc: "Уведомления и вебхуки" },
  ];

  return (
    <div className="min-h-[60vh] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Настройки</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Секция настроек приложения</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cards.map((c) => (
              <Link key={c.href} href={c.href} className="block">
                <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition">
                  <h3 className="font-semibold text-lg">{c.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="font-medium">Параметры записей</h3>
            <ul className="mt-3 text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <li>Услуги</li>
              <li>Сотрудники</li>
              <li>Ресурсы</li>
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
            <h4 className="font-semibold">Финансы</h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              <li>Онлайн-платежи</li>
              <li>Настройки оплаты</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
            <h4 className="font-semibold">Системные настройки</h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              <li>Уведомления</li>
              <li>WebHook</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
