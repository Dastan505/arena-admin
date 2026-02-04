"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type UserInfo = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export default function UserBadge() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setUser({
          first_name: data?.user?.first_name ?? null,
          last_name: data?.user?.last_name ?? null,
          email: data?.user?.email ?? null,
        });
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const displayName = (() => {
    const first = user?.first_name?.trim() || "";
    const last = user?.last_name?.trim() || "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
    return user?.email ?? "Пользователь";
  })();

  const email = user?.email ?? "";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900 px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {displayName}
        </div>
        {email && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {email}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        title="Выйти"
        className="ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 dark:border-slate-700/70 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
