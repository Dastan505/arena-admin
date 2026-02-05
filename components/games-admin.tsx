"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type Game = { id: string; name: string; category?: string | null; price_per_player?: number | null };

type ApiError = {
  error?: string;
  details?: string;
};

export default function GamesAdmin() {
  const [games, setGames] = useState<Game[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [pricePerPlayer, setPricePerPlayer] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games");
      if (!res.ok) {
        const errData: ApiError = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load: ${res.status}`);
      }
      const data = await res.json();
      setGames(data || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load games";
      setError(message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(() => {
    const values = games
      .map((g) => (g.category ?? "").trim())
      .filter((value) => value.length > 0);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Введите название");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: trimmedName, 
          category: category.trim() || null,
          price_per_player: pricePerPlayer.trim() ? Number(pricePerPlayer) : null
        }),
      });
      if (!res.ok) {
        const errData: ApiError = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create: ${res.status}`);
      }
      setName("");
      setCategory("");
      setPricePerPlayer("");
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create";
      setError(message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    if (!g.name.trim()) {
      setError("Название не может быть пустым");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: g.name.trim(), category: g.category ?? null }),
      });
      if (!res.ok) {
        const errData: ApiError = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update: ${res.status}`);
      }
      setEditing(null);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update";
      setError(message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот сеанс?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const errData: ApiError = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to delete: ${res.status}`);
      }
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      setError(message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] items-center">
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
        <input
          className="rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
          placeholder="Цена за чел (₸)"
          type="number"
          value={pricePerPlayer}
          onChange={(e) => setPricePerPlayer(e.target.value)}
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
                <div className="grid gap-2 md:grid-cols-3">
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
                  <input
                    className="w-full rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                    type="number"
                    placeholder="Цена за чел (₸)"
                    value={g.price_per_player ?? ""}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((p) => (p.id === g.id ? { ...p, price_per_player: e.target.value ? Number(e.target.value) : null } : p))
                      )
                    }
                  />
                </div>
              ) : (
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-50">{g.name}</div>
                  <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {g.category && <span>{g.category}</span>}
                    {g.price_per_player && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {g.price_per_player.toLocaleString()} ₸/чел
                      </span>
                    )}
                  </div>
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
