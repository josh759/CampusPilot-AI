"use client";

import { useState, type FormEvent } from "react";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Course, ScheduleItem } from "@/lib/api/types";

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Backend uses Monday=0..Sunday=6; JS Date.getDay() is Sunday=0..Saturday=6.
function backendWeekdayFromDate(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function formatTime(value: string): string {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toBackendTime(value: string): string {
  // <input type="time"> yields "HH:MM"; backend stores "HH:MM:SS".
  return value.length === 5 ? `${value}:00` : value;
}

function toMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function durationMinutes(item: ScheduleItem): number {
  return toMinutes(item.end_time) - toMinutes(item.start_time);
}

type ScheduleFormState = {
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  location: string;
  courseId: string;
};

type TodayScheduleProps = {
  schedule: ScheduleItem[];
  courses: Course[];
  isLoading: boolean;
  dateLabel: string;
  redirectToLogin: () => void;
  onScheduleCreated: (item: ScheduleItem) => void;
  onScheduleUpdated: (item: ScheduleItem) => void;
  onScheduleDeleted: (id: string) => void;
};

export function TodaySchedule({
  schedule,
  courses,
  isLoading,
  dateLabel,
  redirectToLogin,
  onScheduleCreated,
  onScheduleUpdated,
  onScheduleDeleted,
}: TodayScheduleProps) {
  const todayWeekday = backendWeekdayFromDate(new Date());
  const todaysItems = schedule
    .filter((item) => item.weekday === todayWeekday)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const courseCodeById = new Map(courses.map((course) => [course.id, course.code]));

  const emptyForm: ScheduleFormState = {
    title: "",
    weekday: todayWeekday,
    startTime: "",
    endTime: "",
    location: "",
    courseId: "",
  };
  const [form, setForm] = useState<ScheduleFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateForm<K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setError("");
    setForm({
      title: item.title,
      weekday: item.weekday,
      startTime: item.start_time.slice(0, 5),
      endTime: item.end_time.slice(0, 5),
      location: item.location ?? "",
      courseId: item.course_id ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.startTime && form.endTime && toMinutes(toBackendTime(form.endTime)) <= toMinutes(toBackendTime(form.startTime))) {
      setError("End time must be later than start time.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: form.title.trim(),
      weekday: form.weekday,
      start_time: toBackendTime(form.startTime),
      end_time: toBackendTime(form.endTime),
      location: form.location.trim() ? form.location.trim() : null,
      course_id: form.courseId ? form.courseId : null,
    };

    try {
      if (editingId) {
        const updated = await apiRequest<ScheduleItem>(`/schedule/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }, redirectToLogin);
        onScheduleUpdated(updated);
        setEditingId(null);
      } else {
        const created = await apiRequest<ScheduleItem>("/schedule", {
          method: "POST",
          body: JSON.stringify(payload),
        }, redirectToLogin);
        onScheduleCreated(created);
      }
      setForm(emptyForm);
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "Unable to save the schedule item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeItem(id: string) {
    setPendingId(id);
    setError("");
    try {
      await apiRequest<void>(`/schedule/${id}`, { method: "DELETE" }, redirectToLogin);
      onScheduleDeleted(id);
      if (editingId === id) cancelEdit();
    } catch (requestError) {
      if (!(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "Unable to delete the schedule item.");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section id="schedule" aria-labelledby="schedule-heading" className="panel p-5">
      <div className="flex items-center justify-between gap-3"><h2 id="schedule-heading" className="section-title">Today’s schedule</h2><span className="rounded-full bg-[#f2f5f7] px-2 py-1 text-xs text-muted">{todaysItems.length} events</span></div>
      <p className="mt-1 text-xs text-muted">{dateLabel}</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading schedule…</p>
      ) : todaysItems.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing scheduled for today. Add an item below.</p>
      ) : (
        <ol className="mt-6 space-y-6">
          {todaysItems.map((item) => (
            <li key={item.id} className="relative border-l-2 border-line pl-5">
              <span aria-hidden="true" className={`absolute top-1 -left-[5px] h-2 w-2 rounded-full ${item.course_id ? "bg-[#6388a4]" : "bg-coral"}`} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <time dateTime={item.start_time} className="font-semibold">{formatTime(item.start_time)} – {formatTime(item.end_time)}</time>
                <span className="text-muted">{durationMinutes(item)} min</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                {item.course_id ? `${courseCodeById.get(item.course_id) ?? "Course"}` : ""}
                {item.course_id && item.location ? " · " : ""}
                {item.location ?? ""}
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => startEdit(item)} className="button-secondary min-h-9 px-3 text-xs">Edit</button>
                <button type="button" disabled={pendingId === item.id} onClick={() => removeItem(item.id)} className="min-h-9 rounded-xl border border-[#f0c9bd] px-3 text-xs font-semibold text-[#9b402b] hover:bg-[#fff0e6] disabled:cursor-not-allowed disabled:opacity-50">{pendingId === item.id ? "Deleting…" : "Delete"}</button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-line pt-5">
        <p className="text-xs font-semibold text-ink">{editingId ? "Edit schedule item" : "Add a weekly item"}</p>
        <label className="sr-only" htmlFor="schedule-title">Title</label>
        <input id="schedule-title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} required placeholder="Title" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-[#166c83]" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="sr-only" htmlFor="schedule-weekday">Weekday</label>
            <select id="schedule-weekday" value={form.weekday} onChange={(event) => updateForm("weekday", Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-muted outline-none focus:border-[#166c83]">
              {WEEKDAY_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="schedule-course">Course (optional)</label>
            <select id="schedule-course" value={form.courseId} onChange={(event) => updateForm("courseId", event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-muted outline-none focus:border-[#166c83]">
              <option value="">No course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.code}</option>)}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="schedule-start">Start time</label>
            <input id="schedule-start" type="time" value={form.startTime} onChange={(event) => updateForm("startTime", event.target.value)} required className="min-h-11 w-full rounded-xl border border-line px-3 text-sm text-muted outline-none focus:border-[#166c83]" />
          </div>
          <div>
            <label className="sr-only" htmlFor="schedule-end">End time</label>
            <input id="schedule-end" type="time" value={form.endTime} onChange={(event) => updateForm("endTime", event.target.value)} required className="min-h-11 w-full rounded-xl border border-line px-3 text-sm text-muted outline-none focus:border-[#166c83]" />
          </div>
        </div>
        <label className="sr-only" htmlFor="schedule-location">Location (optional)</label>
        <input id="schedule-location" value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="Location (optional)" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-[#166c83]" />
        {error && <p role="alert" className="text-xs text-[#9b402b]">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting} className="button-primary min-h-11 flex-1 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving…" : editingId ? "Save changes" : "Add item"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="button-secondary min-h-11 px-4">Cancel</button>}
        </div>
      </form>
    </section>
  );
}
