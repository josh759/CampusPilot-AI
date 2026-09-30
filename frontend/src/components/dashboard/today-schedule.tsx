import type { ScheduleRecord } from "@/lib/types";

export function TodaySchedule({ schedule, dateLabel }: { schedule: ScheduleRecord[]; dateLabel: string }) {
  return (
    <section id="schedule" aria-labelledby="schedule-heading" className="panel p-5">
      <div className="flex items-center justify-between gap-3"><h2 id="schedule-heading" className="section-title">Today’s schedule</h2><span className="rounded-full bg-[#f2f5f7] px-2 py-1 text-xs text-muted">{schedule.length} events</span></div>
      <p className="mt-1 text-xs text-muted">{dateLabel}</p>
      <ol className="mt-6 space-y-6">
        {schedule.map((event) => (
          <li key={event.id} className="relative border-l-2 border-line pl-5">
            <span aria-hidden="true" className={`absolute top-1 -left-[5px] h-2 w-2 rounded-full ${event.type === "Focus" ? "bg-coral" : "bg-[#6388a4]"}`} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><time dateTime={new Date(event.startTime).toISOString()} className="font-semibold">{new Date(event.startTime).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}</time><span className="text-muted">{Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60_000)} min</span></div>
            <h3 className="mt-2 text-sm font-semibold">{event.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{event.location}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">A little space between tasks goes a long way. Remember to take a break.</p>
    </section>
  );
}
