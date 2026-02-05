"use client";

import Link from "next/link";
import UserBadge from "@/components/user-badge";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 border-r border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Arena Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
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

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
    </div>
  );
}
