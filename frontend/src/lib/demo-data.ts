// Static sample records for the dashboard demo workspace.
// These are presentation fixtures only — live data comes from the
// FastAPI backend through src/lib/api, never from this module.

export const demoUser = {
  name: "Joshua Lee",
  semester: "Fall 2026",
  date: new Date("2026-10-01T12:00:00-04:00"),
  studyHours: 6,
  studyGoal: 10,
  jobApplications: 4,
  interviews: 1,
};
