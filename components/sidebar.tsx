"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Sidebar() {
  const path = usePathname();
  const searchParams = useSearchParams();

  const items = [
    { href: "/", label: "Dashboard" },
    { href: "/?view=schedule", label: "Schedule" },
    { href: "/?view=settings", label: "Настройки" },
  ];

  return (
    <aside className="w-72 h-screen sticky top-0 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
      <div className="px-4 py-6">
        <div className="mb-6">
          <div className="text-xl font-bold">Arena Admin</div>
          <div className="text-xs text-slate-500">Manage arenas & bookings</div>
        </div>

        <nav className="space-y-1">
            {items.map((it) => {
            const isDashboard = it.href === "/" && path === "/";
            const isSchedule = it.href.includes("view=schedule") && 
              path === "/" && searchParams?.get("view") === "schedule";
            const isSettings = it.href.includes("view=settings") && 
              path === "/" && searchParams?.get("view") === "settings";
            const active = isDashboard || isSchedule || isSettings;
            
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="text-sm font-medium">{it.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
