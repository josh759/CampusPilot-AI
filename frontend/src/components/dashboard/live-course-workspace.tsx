"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentManager } from "@/components/dashboard/assignment-manager";
import { CourseGrid } from "@/components/dashboard/course-grid";
import { getAccessToken } from "@/lib/api/auth";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Course } from "@/lib/api/types";

// Owns the live course list shared by the course grid and the assignment
// manager. Loads GET /courses once on mount and appends courses created
// through the grid, so both panels stay in sync without extra requests.
export function LiveCourseWorkspace() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
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

    async function loadCourses() {
      setError("");
      try {
        const loadedCourses = await apiRequest<Course[]>("/courses", { method: "GET" }, redirectToLogin);
        if (isActive) setCourses(loadedCourses);
      } catch (requestError) {
        if (isActive && !(requestError instanceof ApiRequestError && requestError.status === 401)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your courses.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadCourses();
    return () => {
      isActive = false;
    };
  }, [redirectToLogin]);

  const handleCourseCreated = useCallback((course: Course) => {
    setCourses((current) => [...current, course]);
  }, []);

  return (
    <>
      <CourseGrid
        courses={courses}
        isLoading={isLoading}
        error={error}
        onCourseCreated={handleCourseCreated}
        redirectToLogin={redirectToLogin}
        onError={setError}
      />
      <AssignmentManager courses={courses} redirectToLogin={redirectToLogin} />
    </>
  );
}
