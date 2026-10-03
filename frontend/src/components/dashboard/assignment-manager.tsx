"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/auth";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Assignment, AssignmentStatus, Course } from "@/lib/api/types";

function formatDueDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function statusLabel(status: AssignmentStatus) {
  return status === "not_started" ? "Not started" : status === "in_progress" ? "In progress" : "Completed";
}

export function AssignmentManager() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          setCourseId(loadedCourses[0]?.id ?? "");
        }
      } catch (requestError) {
        if (isActive && !(requestError instanceof ApiRequestError && requestError.status === 401)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your assignments.");
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

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        throw new Error("Enter a valid due date and time.");
      }

      const createdAssignment = await apiRequest<Assignment>("/assignments", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          due_at: parsedDueDate.toISOString(),
          status: "not_started",
          course_id: courseId,
        }),
      }, redirectToLogin);
      setAssignments((current) => [...current, createdAssignment].sort((a, b) => a.due_at.localeCompare(b.due_at)));
      setTitle("");
      setDueDate("");
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "Unable to add assignment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeAssignment(id: string) {
    setPendingId(id);
    setError("");
    try {
      const updatedAssignment = await apiRequest<Assignment>(`/assignments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }, redirectToLogin);
      setAssignments((current) => current.map((assignment) => assignment.id === id ? updatedAssignment : assignment));
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "Unable to complete assignment.");
      }
    } finally {
      setPendingId(null);
    }
  }

  async function removeAssignment(id: string) {
    setPendingId(id);
    setError("");
    try {
      await apiRequest<void>(`/assignments/${id}`, { method: "DELETE" }, redirectToLogin);
      setAssignments((current) => current.filter((assignment) => assignment.id !== id));
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "Unable to delete assignment.");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section id="deadlines" aria-labelledby="assignments-heading" className="panel overflow-hidden">
      <div className="border-b border-line px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="assignments-heading" className="section-title">Assignments &amp; deadlines</h2><span className="text-xs text-muted">{assignments.length} total</span></div>
        <form onSubmit={addAssignment} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="sr-only" htmlFor="assignment-title">Assignment title</label>
          <input id="assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Add an assignment" className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-[#166c83]" />
          <label className="sr-only" htmlFor="assignment-due-date">Due date</label>
          <input id="assignment-due-date" type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required className="min-h-11 rounded-xl border border-line px-3 text-sm text-muted outline-none focus:border-[#166c83]" />
          <label className="sr-only" htmlFor="assignment-course">Course</label>
          <select id="assignment-course" value={courseId} onChange={(event) => setCourseId(event.target.value)} required disabled={isLoading || courses.length === 0} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-muted outline-none focus:border-[#166c83]"><option value="" disabled>{isLoading ? "Loading courses…" : "Select course"}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select>
          <button type="submit" disabled={isLoading || isSubmitting || !courseId} className="button-primary min-h-11 px-4 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Adding…" : "Add"}</button>
        </form>
        {!isLoading && courses.length === 0 && <p className="mt-3 text-xs text-muted">Add a course before creating an assignment.</p>}
        {error && <p role="alert" className="mt-3 text-xs text-[#9b402b]">{error}</p>}
      </div>
      {isLoading ? <p className="px-5 py-8 text-sm text-muted">Loading assignments…</p> : assignments.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No assignments yet. Add your next task above.</p> : <ul className="divide-y divide-line">{assignments.map((assignment) => <li key={assignment.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className={`text-sm font-semibold ${assignment.status === "completed" ? "text-muted line-through" : ""}`}>{assignment.title}</h3><p className="mt-1 text-xs text-muted">{courses.find((course) => course.id === assignment.course_id)?.code ?? "Course"} · Due {formatDueDate(assignment.due_at)}</p><p className="mt-2 text-xs text-muted">{statusLabel(assignment.status)}</p></div><div className="flex gap-2"><button type="button" disabled={pendingId === assignment.id || assignment.status === "completed"} onClick={() => completeAssignment(assignment.id)} className="button-secondary min-h-10 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50">{pendingId === assignment.id ? "Updating…" : "Complete"}</button><button type="button" disabled={pendingId === assignment.id} onClick={() => removeAssignment(assignment.id)} className="min-h-10 rounded-xl border border-[#f0c9bd] px-3 text-xs font-semibold text-[#9b402b] hover:bg-[#fff0e6] disabled:cursor-not-allowed disabled:opacity-50">{pendingId === assignment.id ? "Deleting…" : "Delete"}</button></div></li>)}</ul>}
    </section>
  );
}
