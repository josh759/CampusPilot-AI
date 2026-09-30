export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] px-5 py-8 sm:px-8 lg:px-11" aria-busy="true" aria-label="Loading dashboard">
      <div className="mx-auto max-w-[1280px] animate-pulse space-y-7">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-12 w-80 rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="h-32 rounded-2xl bg-slate-200" /><div className="h-32 rounded-2xl bg-slate-200" /><div className="h-32 rounded-2xl bg-slate-200" /><div className="h-32 rounded-2xl bg-slate-200" /></div>
        <div className="grid gap-7 xl:grid-cols-[1.5fr_1fr]"><div className="h-96 rounded-2xl bg-slate-200" /><div className="h-96 rounded-2xl bg-slate-200" /></div>
      </div>
    </div>
  );
}
