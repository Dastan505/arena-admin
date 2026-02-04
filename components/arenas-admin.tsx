"use client";

import { useEffect, useMemo, useState } from "react";

type Arena = {
  id: string;
  name: string;
  address?: string | null;
};

const ROLE_ALLOWLIST = ["admin", "director", "owner", "директор", "управля"];

export default function ArenasAdmin() {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleAllows = (roleName?: string | null) => {
    if (!roleName) return false;
    const role = roleName.toLowerCase();
    return ROLE_ALLOWLIST.some((needle) => role.includes(needle));
  };

  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      const roleName = data?.user?.role?.name ?? null;
      setCanEdit(roleAllows(roleName));
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const loadArenas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/arenas");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setArenas(
        list.map((item: any) => ({
          id: String(item.id),
          name: item.name ?? item.title ?? "",
          address: item.address ?? null,
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить филиалы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadArenas();
  }, []);

  const handleAdd = async () => {
    if (!canEdit) return;
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/arenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Ошибка создания");
        return;
      }
      setName("");
      setAddress("");
      await loadArenas();
    } catch (err) {
      console.error(err);
      setError("Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    if (!canEdit) return;
    const arena = arenas.find((item) => item.id === id);
    if (!arena) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/arenas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: arena.name,
          address: arena.address ?? "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Ошибка сохранения");
        return;
      }
      setEditingId(null);
      await loadArenas();
    } catch (err) {
      console.error(err);
      setError("Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!confirm("Удалить филиал?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/arenas?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Ошибка удаления");
        return;
      }
      await loadArenas();
    } catch (err) {
      console.error(err);
      setError("Ошибка удаления");
    } finally {
      setLoading(false);
    }
  };

  const placeholder = useMemo(() => {
    if (loading) return "Загрузка...";
    return "Название филиала";
  }, [loading]);

  return (
    <div className="p-6">
      <div className="mb-4 space-y-2">
        <div className="grid gap-3 md:grid-cols-[2fr_2fr_auto] items-center">
          <input
            className="rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
          />
          <input
            className="rounded-md border px-3 py-2 bg-white/80 dark:bg-slate-800"
            placeholder="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
          />
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
            onClick={handleAdd}
            disabled={loading || !canEdit}
          >
            Добавить
          </button>
        </div>
        {!canEdit && (
          <div className="text-xs text-slate-500">
            Только главный админ может добавлять и редактировать филиалы.
          </div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}
        {!loading && arenas.length === 0 && (
          <div className="text-sm text-slate-500">Филиалов пока нет</div>
        )}
        {arenas.map((arena) => (
          <div
            key={arena.id}
            className="flex flex-col gap-3 bg-white/60 dark:bg-slate-800 rounded-md p-3 border"
          >
            {editingId === arena.id ? (
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                  value={arena.name}
                  onChange={(e) =>
                    setArenas((prev) =>
                      prev.map((item) => (item.id === arena.id ? { ...item, name: e.target.value } : item))
                    )
                  }
                  disabled={!canEdit}
                />
                <input
                  className="rounded-md border px-2 py-1 bg-white/90 dark:bg-slate-900"
                  value={arena.address ?? ""}
                  onChange={(e) =>
                    setArenas((prev) =>
                      prev.map((item) => (item.id === arena.id ? { ...item, address: e.target.value } : item))
                    )
                  }
                  disabled={!canEdit}
                />
              </div>
            ) : (
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">{arena.name}</div>
                {arena.address && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{arena.address}</div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {editingId === arena.id ? (
                <>
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60"
                    onClick={() => handleSave(arena.id)}
                    disabled={!canEdit}
                  >
                    Сохранить
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => setEditingId(null)}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-3 py-1 bg-yellow-500 rounded disabled:opacity-60"
                    onClick={() => setEditingId(arena.id)}
                    disabled={!canEdit}
                  >
                    Изменить
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-60"
                    onClick={() => handleDelete(arena.id)}
                    disabled={!canEdit}
                  >
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
