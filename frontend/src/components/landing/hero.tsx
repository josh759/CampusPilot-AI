import Link from "next/link";
import { Icon } from "@/components/icon";

function DashboardPreview({ courseCount, studyHours, nextDeadline }: { courseCount: number; studyHours: number; nextDeadline?: { title: string; dueDate: string } }) {
  const deadlineDate = nextDeadline ? new Date(nextDeadline.dueDate) : undefined;
  return (
    <div className="hero-grid relative rounded-[2rem] border border-[#e6dfd2] bg-[#f0ede5] p-5 sm:p-9 lg:p-7 xl:p-10">
      <div className="relative rounded-2xl border border-line bg-white p-5 shadow-[0_20px_70px_-30px_#172b3a50] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-5">
          <span className="eyebrow text-muted">Your day, in focus</span>
          <span className="rounded-full bg-[#edf4ee] px-2.5 py-1 text-xs font-medium text-[#386445]">Demo preview</span>
        </div>
        <p className="mt-6 text-2xl font-semibold tracking-tight">A clear path forward.</p>
        <p className="mt-2 text-sm text-muted">One workspace. More room to think.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#f0f4f8] p-4"><Icon name="book" /><p className="mt-3 text-3xl font-semibold">{courseCount}<span className="ml-2 text-xs font-normal text-muted">courses</span></p></div>
          <div className="rounded-xl bg-[#fff0e6] p-4"><Icon name="clock" /><p className="mt-3 text-3xl font-semibold">{studyHours}<span className="ml-2 text-xs font-normal text-muted">study hrs</span></p></div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line"><Icon name="calendar" /></span>
          <div><p className="text-sm font-semibold">{nextDeadline?.title ?? "No upcoming deadlines"}</p><p className="mt-1 text-xs text-muted">{deadlineDate ? `Next deadline · ${deadlineDate.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}` : "You are all caught up"}</p></div>
        </div>
        <div className="mt-6 rounded-xl bg-ink p-4 text-white">
          <div className="flex items-center gap-2 text-sm font-medium"><Icon name="sparkles" className="h-4 w-4 shrink-0 text-[#f1b28d]" /> Small steps. Real progress.</div>
          <p className="mt-2 text-xs leading-5 text-slate-300">Make time for one focused study session today.</p>
        </div>
      </div>
      <div className="relative mx-auto -mt-1 flex w-fit items-center gap-2 rounded-b-xl bg-[#f1b28d] px-5 py-3 text-xs font-semibold text-ink"><Icon name="check" className="h-4 w-4 shrink-0" /> Less scattered. More prepared.</div>
    </div>
  );
}

export function Hero({ courseCount, studyHours, nextDeadline }: { courseCount: number; studyHours: number; nextDeadline?: { title: string; dueDate: string } }) {
  return (
    <section className="bg-paper">
      <div className="page-width grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-24">
        <div>
          <p className="eyebrow mb-7 flex items-center gap-2 text-coral"><span className="h-2 w-2 shrink-0 rounded-full bg-coral" /> Big ambitions. A clearer plan.</p>
          <h1 className="max-w-2xl text-5xl leading-[1.08] font-semibold tracking-[-0.055em] sm:text-6xl xl:text-7xl">Your academic<br className="hidden sm:block" /> and career <span className="text-coral">copilot.</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-muted">Bring your courses, deadlines, and next steps into focus. CampusPilot AI is your space to study with purpose and plan for what comes next.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="button-primary">Open Dashboard <Icon name="arrow" /></Link>
            <Link href="/#features" className="button-secondary">Explore Features</Link>
          </div>
          <p className="mt-5 text-xs text-muted">Explore the demo. No account needed.</p>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6 text-xs font-medium text-muted">
            <span className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-coral" /> Built around your semester</span>
            <span className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-coral" /> Designed for your next chapter</span>
          </div>
        </div>
        <DashboardPreview courseCount={courseCount} studyHours={studyHours} nextDeadline={nextDeadline} />
      </div>
    </section>
  );
}
