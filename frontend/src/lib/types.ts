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
