"use client";

import { useEffect, useMemo, useState } from "react";

type Game = { id: string; name: string; category?: string | null };

export default function GamesAdmin() {
  const [games, setGames] = useState<Game[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      setGames(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryOptions = useMemo(() => {
    const values = games
      .map((g) => (g.category ?? "").trim())
      .filter((value) => value.length > 0);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category: category.trim() || null }),
      });
      setName("");
      setCategory("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    setLoading(true);
    try {
      await fetch("/api/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: g.name, category: g.category ?? null }),
      });
      setEditing(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот сеанс?")) return;
    setLoading(true);
    try {
      await fetch(`/api/games?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr_auto] items-center">
        <input
          className="flex-1 rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
          placeholder="Название сеанса"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          className="rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
          placeholder="Категория"
          list="session-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <datalist id="session-categories">
          {categoryOptions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
          onClick={handleAdd}
          disabled={loading}
        >
          Добавить
        </button>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}
        {!loading && games.length === 0 && (
          <div className="text-sm text-slate-500">Сеансов пока нет</div>
        )}
        {games.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-3 bg-white/60 dark:bg-slate-800 rounded-md p-3 border"
          >
            <div className="flex-1">
              {editing === g.id ? (
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="w-full rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                    value={g.name}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((p) => (p.id === g.id ? { ...p, name: e.target.value } : p))
                      )
                    }
                  />
                  <input
                    className="w-full rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                    list="session-categories"
                    placeholder="Категория"
                    value={g.category ?? ""}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((p) => (p.id === g.id ? { ...p, category: e.target.value } : p))
                      )
                    }
                  />
                </div>
              ) : (
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-50">{g.name}</div>
                  {g.category && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {g.category}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editing === g.id ? (
                <>
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleSave(g.id)}>
                    Сохранить
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setEditing(null)}>
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button className="px-3 py-1 bg-yellow-500 rounded" onClick={() => setEditing(g.id)}>
                    Изменить
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(g.id)}>
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
