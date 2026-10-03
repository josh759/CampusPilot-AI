import type { Metadata } from "next";
import Link from "next/link";
import { AssignmentManager } from "@/components/dashboard/assignment-manager";
import { CourseGrid } from "@/components/dashboard/course-grid";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StudyAssistant } from "@/components/dashboard/study-assistant";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { Icon } from "@/components/icon";
import { demoAssignments, demoCourses, demoSchedule, demoUser } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard",
  description: "Explore Joshua’s sample semester: courses, upcoming deadlines, a daily schedule, and a study plan preview.",
};

export default function DashboardPage() {
  const dateLabel = demoUser.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });
  const fullDateLabel = demoUser.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const student = { ...demoUser, initials: demoUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() };

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar student={student} />
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-9 lg:py-9 xl:px-11">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5"><p className="eyebrow text-muted">Workspace <span className="mx-2 text-slate-300">/</span> <span className="text-ink">Overview</span></p><span className="rounded-full border border-[#d8e5dd] bg-[#edf4ee] px-3 py-1.5 text-xs font-medium text-[#386445]">{demoUser.semester}</span></div>
          <header className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div><p className="text-xs text-muted"><time dateTime={demoUser.date.toISOString()}>{dateLabel}</time></p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {demoUser.name}</h1><p className="mt-3 text-sm leading-6 text-muted">A fresh day to make progress. Let’s give it some direction.</p></div>
            <Link href="/dashboard#schedule" className="button-secondary w-fit"><Icon name="calendar" className="h-4 w-4" />Today’s schedule</Link>
          </header>
          <p className="mb-6 rounded-xl border border-[#e6dfd2] bg-[#fff9ef] px-4 py-3 text-xs leading-5 text-[#725538]"><strong className="font-semibold">Demo workspace.</strong> Dashboard shows sample records for {fullDateLabel}.</p>
          <SummaryCards courses={demoCourses} assignments={demoAssignments} student={demoUser} />
          <div className="mt-8 grid items-start gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] 2xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)]">
            <div className="min-w-0 space-y-7"><CourseGrid courses={demoCourses} /><AssignmentManager /></div>
            <div className="min-w-0 space-y-6"><TodaySchedule schedule={demoSchedule} dateLabel={`${dateLabel} · Sample schedule`} /><StudyAssistant /></div>
          </div>
          <footer className="mt-9 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-xs text-muted"><p>CampusPilot AI · A little progress, every day.</p><Link href="/" className="rounded hover:text-ink">Back to home <span aria-hidden="true">↗</span></Link></footer>
        </div>
      </main>
    </div>
  );
}
