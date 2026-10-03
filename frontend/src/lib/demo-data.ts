// Static sample records for the dashboard demo workspace.
// These are presentation fixtures only — live data comes from the
// FastAPI backend through src/lib/api, never from this module.

export type ScheduleRecord = {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  location: string;
  type: string;
};

export const demoUser = {
  name: "Joshua Lee",
  semester: "Fall 2026",
  date: new Date("2026-10-01T12:00:00-04:00"),
  studyHours: 6,
  studyGoal: 10,
  jobApplications: 4,
  interviews: 1,
};

export const demoSchedule: ScheduleRecord[] = [
  { id: "schedule-biology", title: "Biology lecture", startTime: "2026-10-01T09:00:00-04:00", endTime: "2026-10-01T10:15:00-04:00", location: "Science Hall · Room 204", type: "Class" },
  { id: "schedule-focus", title: "Focused study session", startTime: "2026-10-01T13:00:00-04:00", endTime: "2026-10-01T14:00:00-04:00", location: "Library · Quiet floor", type: "Focus" },
];
