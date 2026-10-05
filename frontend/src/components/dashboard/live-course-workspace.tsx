"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentManager } from "@/components/dashboard/assignment-manager";
import { CourseGrid } from "@/components/dashboard/course-grid";
import { StudyAssistant } from "@/components/dashboard/study-assistant";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { getAccessToken } from "@/lib/api/auth";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Assignment, Course, ScheduleItem } from "@/lib/api/types";

type LiveCourseWorkspaceProps = {
  student: {
    semester: string;
    studyHours: number;
    studyGoal: number;
    jobApplications: number;
    interviews: number;
  };
  dateLabel: string;
};

// Owns the live course, assignment, and schedule state shared by the summary
// cards, course grid, assignment manager, and today's schedule. Loads
// GET /courses, GET /assignments, and GET /schedule once on mount, then
// applies creates/updates/deletes locally so every panel stays in sync
// without extra requests.
export function LiveCourseWorkspace({ student, dateLabel }: LiveCourseWorkspaceProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let isActive = true;

    if (!getAccessToken()) {
      redirectToLogin();
      return () => {
        isActive = false;
      };
    }

    async function loadData() {
      setError("");
      try {
        const [loadedCourses, loadedAssignments, loadedSchedule] = await Promise.all([
          apiRequest<Course[]>("/courses", { method: "GET" }, redirectToLogin),
          apiRequest<Assignment[]>("/assignments", { method: "GET" }, redirectToLogin),
          apiRequest<ScheduleItem[]>("/schedule", { method: "GET" }, redirectToLogin),
        ]);
        if (isActive) {
          setCourses(loadedCourses);
          setAssignments(loadedAssignments);
          setSchedule(loadedSchedule);
        }
      } catch (requestError) {
        if (isActive && !(requestError instanceof ApiRequestError && requestError.status === 401)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your courses.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      isActive = false;
    };
  }, [redirectToLogin]);

  const handleCourseCreated = useCallback((course: Course) => {
    setCourses((current) => [...current, course]);
  }, []);

  const handleAssignmentCreated = useCallback((assignment: Assignment) => {
    setAssignments((current) => [...current, assignment].sort((a, b) => a.due_at.localeCompare(b.due_at)));
  }, []);

  const handleAssignmentUpdated = useCallback((updated: Assignment) => {
    setAssignments((current) => current.map((assignment) => assignment.id === updated.id ? updated : assignment));
  }, []);

  const handleAssignmentDeleted = useCallback((id: string) => {
    setAssignments((current) => current.filter((assignment) => assignment.id !== id));
  }, []);

  const handleScheduleCreated = useCallback((item: ScheduleItem) => {
    setSchedule((current) => [...current, item].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)));
  }, []);

  const handleScheduleUpdated = useCallback((updated: ScheduleItem) => {
    setSchedule((current) => current.map((item) => item.id === updated.id ? updated : item));
  }, []);

  const handleScheduleDeleted = useCallback((id: string) => {
    setSchedule((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <>
      <div className="min-w-0 space-y-7">
        <SummaryCards courses={courses} assignments={assignments} student={student} />
        <CourseGrid
          courses={courses}
          isLoading={isLoading}
          error={error}
          onCourseCreated={handleCourseCreated}
          redirectToLogin={redirectToLogin}
          onError={setError}
        />
        <AssignmentManager
          courses={courses}
          assignments={assignments}
          isLoading={isLoading}
          redirectToLogin={redirectToLogin}
          onAssignmentCreated={handleAssignmentCreated}
          onAssignmentUpdated={handleAssignmentUpdated}
          onAssignmentDeleted={handleAssignmentDeleted}
        />
      </div>
      <div className="min-w-0 space-y-6">
        <TodaySchedule
          schedule={schedule}
          courses={courses}
          isLoading={isLoading}
          dateLabel={dateLabel}
          redirectToLogin={redirectToLogin}
          onScheduleCreated={handleScheduleCreated}
          onScheduleUpdated={handleScheduleUpdated}
          onScheduleDeleted={handleScheduleDeleted}
        />
        <StudyAssistant
          courses={courses}
          isLoading={isLoading}
          redirectToLogin={redirectToLogin}
        />
      </div>
    </>
  );
}
