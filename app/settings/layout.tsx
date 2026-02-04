import Link from "next/link";
import UserBadge from "@/components/user-badge";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-72 border-r border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Arena Admin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ← На главную
          </Link>

          <div className="mt-6 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Настройки
          </div>
          <Link href="/settings/games" className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            Сеансы
          </Link>
          <Link href="/settings/arenas" className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            Арены
          </Link>
          <Link href="/settings/payments" className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            Платежи
          </Link>
          <Link href="/settings/system" className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            Система
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <UserBadge />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
