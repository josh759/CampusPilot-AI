"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type { Course, StudyAssistantChatRequest, StudyAssistantChatResponse } from "@/lib/api/types";

const MAX_MESSAGE_LENGTH = 2000;

type StudyAssistantProps = {
  courses: Course[];
  isLoading: boolean;
  redirectToLogin: () => void;
};

type Exchange = { question: string; courseLabel: string; answer: string };

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 404:
        return "The selected course could not be found. Choose another course or ask a general question.";
      case 422:
        return `Your question could not be sent. Enter between 1 and ${MAX_MESSAGE_LENGTH} characters.`;
      case 502:
        return "The AI service could not answer right now. Please try again in a moment.";
      case 503:
        return "The AI study assistant is not available yet because it has not been configured.";
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

// Stateless: each request sends only the current message and optional course.
// The backend does not remember earlier questions, so only the latest
// question and answer are shown.
export function StudyAssistant({ courses, isLoading, redirectToLogin }: StudyAssistantProps) {
  const [message, setMessage] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const canSubmit = message.trim().length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const question = message.trim();
    const course = selectedCourse ?? null;
    const body: StudyAssistantChatRequest = { message: question, course_id: course ? course.id : null };

    setIsSubmitting(true);
    setError("");
    setExchange(null);
    try {
      const response = await apiRequest<StudyAssistantChatResponse>(
        "/study-assistant/chat",
        { method: "POST", body: JSON.stringify(body) },
        redirectToLogin,
      );
      if (isMounted.current) {
        setExchange({
          question,
          courseLabel: course ? `${course.code} · ${course.name}` : "General question",
          answer: response.answer,
        });
      }
    } catch (requestError) {
      if (isMounted.current && !(requestError instanceof ApiRequestError && requestError.status === 401)) {
        setError(describeError(requestError));
      }
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  }

  return (
    <section id="study-assistant" aria-labelledby="assistant-heading" className="rounded-2xl bg-ink p-6 text-white">
      <div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f1b28d]"><Icon name="sparkles" /></span><span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-slate-200">AI study tutor</span></div>
      <h2 id="assistant-heading" className="mt-5 text-xl font-semibold tracking-tight">Make your next study<br />session count.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">Ask a question about a topic or a course. Each question is answered on its own; the assistant does not remember earlier questions.</p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="grid gap-1.5">
          <label htmlFor="assistant-course" className="text-xs font-semibold text-slate-200">Course (optional)</label>
          <select id="assistant-course" value={selectedCourse ? selectedCourseId : ""} onChange={(event) => setSelectedCourseId(event.target.value)} disabled={isLoading || isSubmitting} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#f1b28d]">
            <option value="" className="text-ink">General question</option>
            {courses.map((course) => <option key={course.id} value={course.id} className="text-ink">{course.code} · {course.name}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="assistant-message" className="text-xs font-semibold text-slate-200">Your question</label>
          <textarea id="assistant-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={4} placeholder="Help me prepare for my operating systems quiz" className="resize-y rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-slate-400 focus:border-[#f1b28d]" />
          <p className="text-right text-[11px] text-slate-300" aria-live="polite">{message.length} / {MAX_MESSAGE_LENGTH}</p>
        </div>
        <button type="submit" disabled={!canSubmit} aria-busy={isSubmitting} className="min-h-11 w-full rounded-xl bg-[#f1b28d] px-4 py-3 text-sm font-semibold text-ink hover:bg-[#f6c4a6] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Thinking…" : "Ask the assistant"}</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl border border-[#f1b28d]/40 bg-white/10 px-3 py-2 text-xs leading-5 text-[#f6c4a6]">{error}</p>}
      {exchange && (
        <div className="mt-5 border-t border-white/20 pt-5" aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{exchange.courseLabel}</p>
          <h3 className="mt-2 text-xs font-semibold text-slate-200">Your question</h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{exchange.question}</p>
          <h3 className="mt-4 text-sm font-semibold">Answer</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{exchange.answer}</p>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">AI-generated. Check important details against your course materials.</p>
        </div>
      )}
    </section>
  );
}
