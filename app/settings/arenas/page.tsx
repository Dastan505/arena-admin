import ArenasAdmin from "@/components/arenas-admin";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Филиалы</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Управляйте филиалами: название и адрес.
        </p>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4">
          <ArenasAdmin />
        </div>
      </div>
    </div>
  );
}
