"use client";

import { useEffect, useState } from "react";

type Game = { id: string; name: string };

export default function GamesAdmin() {
  const [games, setGames] = useState<Game[]>([]);
  const [name, setName] = useState("");
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

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
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
        body: JSON.stringify({ id, name: g.name }),
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
    if (!confirm("Delete this game?")) return;
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
      <div className="mb-4 flex items-center gap-3">
        <input
          className="flex-1 rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
          placeholder="New game name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
          onClick={handleAdd}
          disabled={loading}
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && games.length === 0 && (
          <div className="text-sm text-slate-500">No games yet</div>
        )}
        {games.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-3 bg-white/60 dark:bg-slate-800 rounded-md p-3 border"
          >
            <div className="flex-1">
              {editing === g.id ? (
                <input
                  className="w-full rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                  value={g.name}
                  onChange={(e) =>
                    setGames((prev) => prev.map((p) => (p.id === g.id ? { ...p, name: e.target.value } : p)))
                  }
                />
              ) : (
                <div className="font-medium text-slate-900 dark:text-slate-50">{g.name}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editing === g.id ? (
                <>
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleSave(g.id)}>
                    Save
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="px-3 py-1 bg-yellow-500 rounded" onClick={() => setEditing(g.id)}>
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(g.id)}>
                    Delete
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
