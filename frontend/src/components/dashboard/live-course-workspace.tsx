"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentManager } from "@/components/dashboard/assignment-manager";
import { CourseGrid } from "@/components/dashboard/course-grid";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { getAccessToken } from "@/lib/api/auth";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Assignment, Course } from "@/lib/api/types";

type LiveCourseWorkspaceProps = {
  student: {
    semester: string;
    studyHours: number;
    studyGoal: number;
    jobApplications: number;
    interviews: number;
  };
};

// Owns the live course and assignment state shared by the summary cards,
// course grid, and assignment manager. Loads GET /courses and
// GET /assignments once on mount, then applies creates/updates/deletes
// locally so every panel stays in sync without extra requests.
export function LiveCourseWorkspace({ student }: LiveCourseWorkspaceProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
        const [loadedCourses, loadedAssignments] = await Promise.all([
          apiRequest<Course[]>("/courses", { method: "GET" }, redirectToLogin),
          apiRequest<Assignment[]>("/assignments", { method: "GET" }, redirectToLogin),
        ]);
        if (isActive) {
          setCourses(loadedCourses);
          setAssignments(loadedAssignments);
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

  return (
    <>
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
    </>
  );
}
