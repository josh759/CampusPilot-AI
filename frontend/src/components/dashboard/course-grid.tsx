import { Icon } from "@/components/icon";
import type { CourseRecord } from "@/lib/types";

const accents = {
  blue: { badge: "bg-[#e7f0f8] text-[#365d82]", bar: "bg-[#618bad]" },
  violet: { badge: "bg-[#eeebf9] text-[#645391]", bar: "bg-[#9380b7]" },
  amber: { badge: "bg-[#fcf0d9] text-[#855f1d]", bar: "bg-[#c39a4f]" },
  green: { badge: "bg-[#e6f1e9] text-[#3c6c50]", bar: "bg-[#67967a]" },
} as const;

function CourseCard({ course, accent }: { course: CourseRecord; accent: keyof typeof accents }) {
  const colors = accents[accent];
  const progress = Math.round(course.progress / course.totalModules * 100);
  return (
    <article className="panel p-5">
      <div className="flex items-center justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.badge}`}><Icon name="book" /></span><span className="font-mono text-xs text-muted">{course.courseCode}</span></div>
      <h3 className="mt-4 font-semibold tracking-tight">{course.title}</h3>
      <p className="mt-1 text-xs text-muted">{course.instructor}</p>
      <div className="mt-5">
        <div className="flex justify-between gap-2 text-xs text-muted"><span>Course progress</span><span>{course.progress}/{course.totalModules} modules</span></div>
        <div role="progressbar" aria-label={`${course.title} modules completed`} aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={course.totalModules} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${progress}%` }} /></div>
      </div>
    </article>
  );
}

export function CourseGrid({ courses }: { courses: CourseRecord[] }) {
  return (
    <section id="courses" aria-labelledby="courses-heading">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="courses-heading" className="section-title">Current courses</h2><span className="text-xs text-muted">{courses.length} active courses</span></div>
      <div className="grid gap-4 sm:grid-cols-2">{courses.map((course, index) => <CourseCard key={course.id} course={course} accent={(["blue", "violet", "amber", "green"] as const)[index % 4]} />)}</div>
    </section>
  );
}
