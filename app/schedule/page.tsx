import { Suspense } from "react";
import ScheduleView from "./schedule-view";

function ScheduleLoading() {
  return (
    <div className="flex w-full h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading schedule...</p>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView />
    </Suspense>
  );
}
