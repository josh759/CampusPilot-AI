import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";

const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/dashboard", icon: "grid" },
  { label: "My courses", href: "/dashboard#courses", icon: "book" },
  { label: "Deadlines", href: "/dashboard#deadlines", icon: "calendar" },
  { label: "Study assistant", href: "/dashboard#study-assistant", icon: "sparkles" },
];

export function Sidebar({ student }: { student: { name: string; initials: string } }) {
  return (
    <aside className="bg-ink text-slate-200 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto xl:w-72">
      <div className="px-5 py-6 lg:px-7 lg:pt-9"><Brand light /><p className="mt-3 hidden text-xs text-slate-400 lg:block">A clearer path through college.</p></div>
      <nav aria-label="Dashboard navigation" className="px-4 pb-5 lg:flex-1 lg:px-5 lg:pt-7">
        <p className="eyebrow mb-4 hidden px-3 text-slate-400 lg:block">Your workspace</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {navigation.map((item, index) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={index === 0 ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${index === 0 ? "bg-[#f1b28d] text-ink" : "text-slate-200 hover:bg-white/10"}`}>
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />{item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden px-5 pb-6 lg:block">
        <div className="rounded-xl border border-white/15 bg-white/5 p-4"><p className="text-sm font-medium text-white">One step at a time.</p><p className="mt-2 text-xs leading-5 text-slate-300">A focused hour today is an investment in tomorrow.</p></div>
        <Link href="/" className="mt-5 flex min-h-11 items-center gap-2 rounded px-3 text-sm text-slate-300 hover:text-white"><Icon name="arrow" className="h-4 w-4 rotate-180" />Back to home</Link>
      </div>
      <div className="hidden items-center gap-3 border-t border-white/10 px-7 py-6 lg:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#345064] text-sm font-semibold text-white" aria-hidden="true">{student.initials}</span>
        <div><p className="text-sm font-medium text-white">{student.name}</p><p className="mt-0.5 text-xs text-slate-400">Student demo</p></div>
      </div>
    </aside>
  );
}
