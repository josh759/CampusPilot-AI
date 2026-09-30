"use client";

import { useState } from "react";
import type { AssignmentRecord, CourseRecord } from "@/lib/types";

function formatDueDate(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function statusLabel(status: AssignmentRecord["status"]) {
  return status === "NOT_STARTED" ? "Not started" : status === "IN_PROGRESS" ? "In progress" : "Completed";
}

export function AssignmentManager({ initialAssignments, courses }: { initialAssignments: AssignmentRecord[]; courses: CourseRecord[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function refreshAssignments() {
    const response = await fetch("/api/assignments", { cache: "no-store" });
    const result = (await response.json()) as { data?: AssignmentRecord[]; error?: string };
    if (!response.ok || !result.data) throw new Error(result.error ?? "Unable to refresh assignments.");
    setAssignments(result.data);
  }

  async function addAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate, courseId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to add assignment.");
      setTitle("");
      setDueDate("");
      await refreshAssignments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add assignment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeAssignment(id: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to complete assignment.");
      await refreshAssignments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete assignment.");
    } finally {
      setPendingId(null);
    }
  }

  async function removeAssignment(id: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to delete assignment.");
      }
      await refreshAssignments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete assignment.");
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
          <select id="assignment-course" value={courseId} onChange={(event) => setCourseId(event.target.value)} required className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-muted outline-none focus:border-[#166c83]"><option value="" disabled>Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.courseCode}</option>)}</select>
          <button type="submit" disabled={isSubmitting || !courseId} className="button-primary min-h-11 px-4 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Adding…" : "Add"}</button>
        </form>
        {error && <p role="alert" className="mt-3 text-xs text-[#9b402b]">{error}</p>}
      </div>
      {assignments.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No assignments yet. Add your next task above.</p> : <ul className="divide-y divide-line">{assignments.map((assignment) => <li key={assignment.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className={`text-sm font-semibold ${assignment.status === "COMPLETED" ? "text-muted line-through" : ""}`}>{assignment.title}</h3><p className="mt-1 text-xs text-muted">{assignment.course.courseCode} · Due {formatDueDate(assignment.dueDate)}</p><p className="mt-2 text-xs text-muted">{statusLabel(assignment.status)}</p></div><div className="flex gap-2"><button type="button" disabled={pendingId === assignment.id || assignment.status === "COMPLETED"} onClick={() => completeAssignment(assignment.id)} className="button-secondary min-h-10 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50">Complete</button><button type="button" disabled={pendingId === assignment.id} onClick={() => removeAssignment(assignment.id)} className="min-h-10 rounded-xl border border-[#f0c9bd] px-3 text-xs font-semibold text-[#9b402b] hover:bg-[#fff0e6] disabled:cursor-not-allowed disabled:opacity-50">Delete</button></div></li>)}</ul>}
    </section>
  );
}
