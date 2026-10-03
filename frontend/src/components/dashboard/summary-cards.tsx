import { Icon, type IconName } from "@/components/icon";
import type { Assignment, Course } from "@/lib/api/types";

type StudentStats = {
  semester: string;
  studyHours: number;
  studyGoal: number;
  jobApplications: number;
  interviews: number;
};

export function SummaryCards({ courses, assignments, student }: { courses: Course[]; assignments: Assignment[]; student: StudentStats }) {
  const now = new Date();
  const upcomingCount = assignments.filter((assignment) => {
    const due = new Date(assignment.due_at);
    return assignment.status !== "completed" && due.getTime() >= now.getTime();
  }).length;
  const metrics: { label: string; value: string; detail: string; icon: IconName }[] = [
    { label: "Current courses", value: String(courses.length).padStart(2, "0"), detail: student.semester, icon: "book" },
    { label: "Upcoming assignments", value: String(upcomingCount).padStart(2, "0"), detail: "Not yet completed", icon: "calendar" },
    { label: "Study hours", value: String(student.studyHours), detail: `of ${student.studyGoal} hour weekly goal`, icon: "clock" },
    { label: "Job applications", value: String(student.jobApplications).padStart(2, "0"), detail: `${student.interviews} interviews scheduled`, icon: "briefcase" },
  ];
  return (
    <section aria-label="Semester at a glance">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel relative p-5">
            <dt className="min-h-8 pr-9 text-xs font-medium text-muted">{metric.label}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight">{metric.value}</dd>
            <dd className="mt-2 text-xs text-muted">{metric.detail}</dd>
            <dd aria-hidden="true" className="absolute top-4 right-4 rounded-lg bg-[#f2f5f7] p-2 text-muted"><Icon name={metric.icon} className="h-4 w-4" /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
