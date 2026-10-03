// Static sample records for the dashboard demo workspace.
// These are presentation fixtures only — live data comes from the
// FastAPI backend through src/lib/api, never from this module.

export type CourseRecord = {
  id: string;
  title: string;
  courseCode: string;
  instructor: string;
  progress: number;
  totalModules: number;
};

export type AssignmentRecord = {
  id: string;
  title: string;
  dueDate: string | Date;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  courseId: string;
  course: {
    title: string;
    courseCode: string;
  };
};

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

export const demoCourses: CourseRecord[] = [
  { id: "course-bio-101", title: "Introduction to Biology", courseCode: "BIO 101", instructor: "Dr. Morgan", progress: 6, totalModules: 10 },
  { id: "course-cs-210", title: "Data Structures", courseCode: "CS 210", instructor: "Prof. Patel", progress: 8, totalModules: 12 },
  { id: "course-eng-205", title: "Writing and Rhetoric", courseCode: "ENG 205", instructor: "Dr. Chen", progress: 4, totalModules: 8 },
];

export const demoAssignments: AssignmentRecord[] = [
  { id: "assignment-bio-lab", title: "Cell structure lab report", dueDate: "2026-10-03T23:59:00-04:00", status: "IN_PROGRESS", courseId: "course-bio-101", course: { title: "Introduction to Biology", courseCode: "BIO 101" } },
  { id: "assignment-cs-project", title: "Linked list exercises", dueDate: "2026-10-05T23:59:00-04:00", status: "NOT_STARTED", courseId: "course-cs-210", course: { title: "Data Structures", courseCode: "CS 210" } },
];

export const demoSchedule: ScheduleRecord[] = [
  { id: "schedule-biology", title: "Biology lecture", startTime: "2026-10-01T09:00:00-04:00", endTime: "2026-10-01T10:15:00-04:00", location: "Science Hall · Room 204", type: "Class" },
  { id: "schedule-focus", title: "Focused study session", startTime: "2026-10-01T13:00:00-04:00", endTime: "2026-10-01T14:00:00-04:00", location: "Library · Quiet floor", type: "Focus" },
];
