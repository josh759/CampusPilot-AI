"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Course } from "@/lib/api/types";

const accents = {
  blue: { badge: "bg-[#e7f0f8] text-[#365d82]", bar: "bg-[#618bad]" },
  violet: { badge: "bg-[#eeebf9] text-[#645391]", bar: "bg-[#9380b7]" },
  amber: { badge: "bg-[#fcf0d9] text-[#855f1d]", bar: "bg-[#c39a4f]" },
  green: { badge: "bg-[#e6f1e9] text-[#3c6c50]", bar: "bg-[#67967a]" },
} as const;

function CourseCard({ course, accent }: { course: Course; accent: keyof typeof accents }) {
  const colors = accents[accent];
  return (
    <article className="panel p-5">
      <div className="flex items-center justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.badge}`}><Icon name="book" /></span><span className="font-mono text-xs text-muted">{course.code}</span></div>
      <h3 className="mt-4 font-semibold tracking-tight">{course.name}</h3>
    </article>
  );
}

type CourseGridProps = {
  courses: Course[];
  isLoading: boolean;
  error: string;
  onCourseCreated: (course: Course) => void;
  redirectToLogin: () => void;
  onError: (message: string) => void;
};

export function CourseGrid({ courses, isLoading, error, onCourseCreated, redirectToLogin, onError }: CourseGridProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    onError("");
    try {
      const createdCourse = await apiRequest<Course>("/courses", {
        method: "POST",
        body: JSON.stringify({ code: code.trim(), name: name.trim() }),
      }, redirectToLogin);
      onCourseCreated(createdCourse);
      setCode("");
      setName("");
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        onError(requestError instanceof Error ? requestError.message : "Unable to add course.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="courses" aria-labelledby="courses-heading">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="courses-heading" className="section-title">Current courses</h2><span className="text-xs text-muted">{courses.length} active courses</span></div>
      <form onSubmit={addCourse} className="mb-4 grid gap-3 rounded-2xl border border-line bg-white/60 p-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="course-code">Course code</label>
        <input id="course-code" value={code} onChange={(event) => setCode(event.target.value)} required placeholder="Code (e.g. BIO 101)" className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-[#166c83]" />
        <label className="sr-only" htmlFor="course-name">Course name</label>
        <input id="course-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Course name" className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-[#166c83]" />
        <button type="submit" disabled={isSubmitting} className="button-primary min-h-11 px-4 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Adding…" : "Add course"}</button>
      </form>
      {error && <p role="alert" className="mb-4 text-xs text-[#9b402b]">{error}</p>}
      {isLoading ? <p className="text-sm text-muted">Loading courses…</p> : courses.length === 0 ? <p className="text-sm text-muted">No courses yet. Add your first course above.</p> : <div className="grid gap-4 sm:grid-cols-2">{courses.map((course, index) => <CourseCard key={course.id} course={course} accent={(["blue", "violet", "amber", "green"] as const)[index % 4]} />)}</div>}
    </section>
  );
}
