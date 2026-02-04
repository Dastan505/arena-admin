import SettingsDashboard from "@/components/settings-dashboard";

export default function SettingsIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <SettingsDashboard />
      </div>
    </div>
  );
}
