"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Icon } from "@/components/icon";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type {
  Course,
  StudyConversationCreateRequest,
  StudyConversationDetail,
  StudyConversationSummary,
  StudyMessage,
  StudyMessageCreateRequest,
  StudyMessageExchange,
} from "@/lib/api/types";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 120;

type StudyAssistantProps = {
  courses: Course[];
  isLoading: boolean;
  redirectToLogin: () => void;
};

// Untrusted AI output: raw HTML is never parsed (no rehype-raw), and images and
// links are unwrapped to plain text so the model cannot embed remote content or URLs.
const markdownComponents: Components = {
  p: ({ children }) => <p className="mt-2 break-words text-sm leading-6 text-slate-100 first:mt-0">{children}</p>,
  h1: ({ children }) => <h4 className="mt-4 break-words text-base font-semibold text-white first:mt-0">{children}</h4>,
  h2: ({ children }) => <h4 className="mt-4 break-words text-sm font-semibold text-white first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-3 break-words text-sm font-semibold text-slate-100 first:mt-0">{children}</h5>,
  h4: ({ children }) => <h5 className="mt-3 break-words text-sm font-semibold text-slate-100 first:mt-0">{children}</h5>,
  h5: ({ children }) => <h5 className="mt-3 break-words text-sm font-semibold text-slate-100 first:mt-0">{children}</h5>,
  h6: ({ children }) => <h5 className="mt-3 break-words text-sm font-semibold text-slate-100 first:mt-0">{children}</h5>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-100">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-100">{children}</ol>,
  li: ({ children }) => <li className="break-words">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-2 border-l-2 border-[#f1b28d]/60 pl-3 text-slate-200">{children}</blockquote>,
  pre: ({ children }) => <pre className="mt-2 overflow-x-auto rounded-xl bg-white/10 p-3 text-xs leading-5 text-slate-100">{children}</pre>,
  code: ({ children, className }) => className
    ? <code className="font-mono">{children}</code>
    : <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-[#f6c4a6]">{children}</code>,
};

// Convert common \( \) and \[ \] delimiters to $ and $$ outside code fences/spans.
function normalizeMathDelimiters(text: string): string {
  return text
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g)
    .map((part, index) => index % 2 === 1 ? part : part
      .replace(/\\\[([\s\S]+?)\\\]/g, (_m, math: string) => `\n$$\n${math.trim()}\n$$\n`)
      .replace(/\\\(([\s\S]+?)\\\)/g, (_m, math: string) => `$${math.trim()}$`))
    .join("");
}


type ErrorContext = "list" | "open" | "create" | "send" | "delete";

// Maps failures to fixed, user-safe messages; raw server details are never shown.
function describeError(error: unknown, context: ErrorContext): string {
  if (error instanceof ApiRequestError) {
    switch (error.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 404:
        if (context === "create") return "The selected course could not be found. Choose another course or a general question.";
        if (context === "delete") return "This conversation no longer exists.";
        return "This conversation no longer exists. It may have been deleted.";
      case 422:
        if (context === "create") return `The conversation could not be created. Titles can be up to ${MAX_TITLE_LENGTH} characters.`;
        return `Your message could not be sent. Enter between 1 and ${MAX_MESSAGE_LENGTH} characters.`;
      case 502:
        return "The AI service could not answer right now. Your message was not saved. Please try again in a moment.";
      case 503:
        return "The AI study assistant is not available yet because it has not been configured.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return error instanceof Error && !(error instanceof ApiRequestError)
    ? error.message
    : "Something went wrong. Please try again.";
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const alertClass = "rounded-xl border border-[#f1b28d]/40 bg-white/10 px-3 py-2 text-xs leading-5 text-[#f6c4a6]";
const focusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1b28d]";
const inputClass = "rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#f1b28d]";

export function StudyAssistant({ courses, isLoading, redirectToLogin }: StudyAssistantProps) {
  const [conversations, setConversations] = useState<StudyConversationSummary[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudyConversationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const isMounted = useRef(true);
  const selectedIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await apiRequest<StudyConversationSummary[]>("/study-assistant/conversations", { method: "GET" }, redirectToLogin);
      if (!isMounted.current) return;
      setConversations(list);
      setListError("");
    } catch (requestError) {
      if (isMounted.current && !isUnauthorized(requestError)) setListError(describeError(requestError, "list"));
    } finally {
      if (isMounted.current) setIsListLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    apiRequest<StudyConversationSummary[]>("/study-assistant/conversations", { method: "GET" }, redirectToLogin)
      .then((list) => {
        if (isMounted.current) setConversations(list);
      })
      .catch((requestError: unknown) => {
        if (isMounted.current && !isUnauthorized(requestError)) setListError(describeError(requestError, "list"));
      })
      .finally(() => {
        if (isMounted.current) setIsListLoading(false);
      });
  }, [redirectToLogin]);

  const messageCount = detail?.messages.length ?? 0;
  useEffect(() => {
    if (messageCount > 0) endRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [messageCount, detail?.id]);

  function courseLabel(courseId: string | null): string {
    if (!courseId) return "General question";
    const course = courses.find((item) => item.id === courseId);
    return course ? `${course.code} · ${course.name}` : "Course unavailable";
  }

  async function openConversation(id: string) {
    if (id === selectedIdRef.current && detail) return;
    selectedIdRef.current = id;
    setSelectedId(id);
    setDetail(null);
    setDetailError("");
    setSendError("");
    setMessage("");
    setIsCreateOpen(false);
    setIsDetailLoading(true);
    try {
      const result = await apiRequest<StudyConversationDetail>(`/study-assistant/conversations/${encodeURIComponent(id)}`, { method: "GET" }, redirectToLogin);
      if (isMounted.current && selectedIdRef.current === id) setDetail(result);
    } catch (requestError) {
      if (isMounted.current && selectedIdRef.current === id && !isUnauthorized(requestError)) {
        setDetailError(describeError(requestError, "open"));
        if (requestError instanceof ApiRequestError && requestError.status === 404) void loadConversations();
      }
    } finally {
      if (isMounted.current && selectedIdRef.current === id) setIsDetailLoading(false);
    }
  }

  function startNewChat() {
    setIsCreateOpen(true);
    setCreateError("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;
    const course = courses.find((item) => item.id === newCourseId) ?? null;
    const body: StudyConversationCreateRequest = { course_id: course ? course.id : null, title: newTitle.trim() || null };

    setIsCreating(true);
    setCreateError("");
    try {
      const created = await apiRequest<StudyConversationSummary>(
        "/study-assistant/conversations",
        { method: "POST", body: JSON.stringify(body) },
        redirectToLogin,
      );
      if (!isMounted.current) return;
      setConversations((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      selectedIdRef.current = created.id;
      setSelectedId(created.id);
      setDetail({ ...created, messages: [] });
      setDetailError("");
      setIsDetailLoading(false);
      setSendError("");
      setMessage("");
      setNewTitle("");
      setNewCourseId("");
      setIsCreateOpen(false);
    } catch (requestError) {
      if (isMounted.current && !isUnauthorized(requestError)) setCreateError(describeError(requestError, "create"));
    } finally {
      if (isMounted.current) setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setDeleteError("");
    try {
      await apiRequest<void>(`/study-assistant/conversations/${encodeURIComponent(id)}`, { method: "DELETE" }, redirectToLogin);
      if (!isMounted.current) return;
      setConversations((current) => current.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      if (selectedIdRef.current === id) {
        selectedIdRef.current = null;
        setSelectedId(null);
        setDetail(null);
        setDetailError("");
        setMessage("");
        setSendError("");
      }
    } catch (requestError) {
      if (!isMounted.current || isUnauthorized(requestError)) return;
      setDeleteError(describeError(requestError, "delete"));
      setConfirmDeleteId(null);
      if (requestError instanceof ApiRequestError && requestError.status === 404) {
        setConversations((current) => current.filter((item) => item.id !== id));
        if (selectedIdRef.current === id) {
          selectedIdRef.current = null;
          setSelectedId(null);
          setDetail(null);
        }
      }
    } finally {
      if (isMounted.current) setDeletingId(null);
    }
  }

  const trimmedMessage = message.trim();
  const canSend = Boolean(detail) && trimmedMessage.length > 0 && trimmedMessage.length <= MAX_MESSAGE_LENGTH && !isSending;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !canSend || sendingRef.current) return;

    const conversationId = detail.id;
    const body: StudyMessageCreateRequest = { message: trimmedMessage };
    sendingRef.current = true;
    setIsSending(true);
    setSendError("");
    try {
      const exchange = await apiRequest<StudyMessageExchange>(
        `/study-assistant/conversations/${encodeURIComponent(conversationId)}/messages`,
        { method: "POST", body: JSON.stringify(body) },
        redirectToLogin,
      );
      if (!isMounted.current) return;
      setConversations((current) => [exchange.conversation, ...current.filter((item) => item.id !== exchange.conversation.id)]);
      if (selectedIdRef.current === conversationId) {
        setDetail((current) => current && current.id === conversationId
          ? { ...current, ...exchange.conversation, messages: [...current.messages, exchange.user_message, exchange.assistant_message] }
          : current);
        setMessage("");
      }
    } catch (requestError) {
      if (isMounted.current && !isUnauthorized(requestError) && selectedIdRef.current === conversationId) {
        setSendError(describeError(requestError, "send"));
        if (requestError instanceof ApiRequestError && requestError.status === 404) void loadConversations();
      }
    } finally {
      sendingRef.current = false;
      if (isMounted.current) setIsSending(false);
    }
  }

  function renderMessage(item: StudyMessage) {
    if (item.role === "user") {
      return (
        <li key={item.id} className="ml-6 rounded-xl bg-white/10 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">You · <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time></p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{item.content}</p>
        </li>
      );
    }
    return (
      <li key={item.id} className="mr-6 rounded-xl border border-[#f1b28d]/30 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f1b28d]">Tutor · <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time></p>
        <div className="mt-1 min-w-0 break-words"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: "ignore", trust: false, throwOnError: false }]]} components={markdownComponents} disallowedElements={["img", "a"]} unwrapDisallowed skipHtml>{normalizeMathDelimiters(item.content)}</ReactMarkdown></div>
      </li>
    );
  }

  return (
    <section id="study-assistant" aria-labelledby="assistant-heading" className="rounded-2xl bg-ink p-6 text-white">
      <div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f1b28d]"><Icon name="sparkles" /></span><span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-slate-200">AI study tutor</span></div>
      <h2 id="assistant-heading" className="mt-5 text-xl font-semibold tracking-tight">Make your next study<br />session count.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">Start a chat about a topic or a course. Your conversations are saved so you can pick up where you left off.</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 id="conversations-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-300">Conversations</h3>
        <button type="button" onClick={startNewChat} disabled={isCreating} className={`min-h-11 rounded-xl bg-[#f1b28d] px-4 text-sm font-semibold text-ink transition hover:bg-[#f6c4a6] disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}>New chat</button>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreate} aria-label="New conversation" className="mt-3 space-y-3 rounded-xl border border-white/20 p-3">
          <div className="grid gap-1.5">
            <label htmlFor="assistant-new-course" className="text-xs font-semibold text-slate-200">Course</label>
            <select id="assistant-new-course" value={courses.some((course) => course.id === newCourseId) ? newCourseId : ""} onChange={(event) => setNewCourseId(event.target.value)} disabled={isLoading || isCreating} className={`min-h-11 ${inputClass}`}>
              <option value="" className="text-ink">General question</option>
              {courses.map((course) => <option key={course.id} value={course.id} className="text-ink">{course.code} · {course.name}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="assistant-new-title" className="text-xs font-semibold text-slate-200">Title (optional)</label>
            <input id="assistant-new-title" type="text" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={MAX_TITLE_LENGTH} disabled={isCreating} placeholder="Defaults to your first question" className={`min-h-11 ${inputClass}`} />
          </div>
          {createError && <p role="alert" className={alertClass}>{createError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isCreating} aria-busy={isCreating} className={`min-h-11 flex-1 rounded-xl bg-[#f1b28d] px-4 text-sm font-semibold text-ink transition hover:bg-[#f6c4a6] disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}>{isCreating ? "Creating..." : "Start chat"}</button>
            <button type="button" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className={`min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-slate-100 hover:bg-white/10 disabled:opacity-60 ${focusClass}`}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-3" aria-labelledby="conversations-heading">
        {isListLoading ? (
          <p role="status" className="text-xs text-slate-300">Loading conversations...</p>
        ) : listError ? (
          <div role="alert" className={alertClass}>
            <p>{listError}</p>
            <button type="button" onClick={() => { setIsListLoading(true); void loadConversations(); }} className={`mt-2 min-h-11 rounded-lg border border-white/20 px-3 font-semibold text-slate-100 hover:bg-white/10 ${focusClass}`}>Try again</button>
          </div>
        ) : conversations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 px-3 py-4 text-xs leading-5 text-slate-300">No conversations yet. Select New chat to ask your first question.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              const isConfirming = conversation.id === confirmDeleteId;
              return (
                <li key={conversation.id} className={`rounded-xl border p-1 ${isSelected ? "border-[#f1b28d] bg-white/15" : "border-white/20 bg-white/5"}`}>
                  <div className="flex items-stretch gap-1">
                    <button type="button" onClick={() => void openConversation(conversation.id)} aria-current={isSelected ? "true" : undefined} className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left hover:bg-white/10 ${focusClass}`}>
                      <span className="block truncate text-sm font-semibold text-white">{conversation.title}</span>
                      <span className="block truncate text-[11px] text-slate-300">{courseLabel(conversation.course_id)}</span>
                      <time dateTime={conversation.updated_at} className="block text-[11px] text-slate-400">{formatDateTime(conversation.updated_at)}</time>
                    </button>
                    {!isConfirming && (
                      <button type="button" onClick={() => { setDeleteError(""); setConfirmDeleteId(conversation.id); }} disabled={deletingId !== null} aria-label={`Delete conversation ${conversation.title}`} className={`min-h-11 rounded-lg px-3 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-[#f6c4a6] disabled:opacity-60 ${focusClass}`}>Delete</button>
                    )}
                  </div>
                  {isConfirming && (
                    <div role="group" aria-label={`Confirm deleting ${conversation.title}`} className="mt-1 flex flex-wrap items-center gap-2 px-2 pb-1.5">
                      <span className="text-xs text-[#f6c4a6]">Delete this chat and its messages?</span>
                      <button type="button" onClick={() => void handleDelete(conversation.id)} disabled={deletingId !== null} aria-busy={deletingId === conversation.id} className={`min-h-11 rounded-lg bg-[#f1b28d] px-3 text-xs font-semibold text-ink disabled:opacity-60 ${focusClass}`}>{deletingId === conversation.id ? "Deleting..." : "Confirm delete"}</button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={deletingId !== null} className={`min-h-11 rounded-lg border border-white/20 px-3 text-xs font-semibold text-slate-100 disabled:opacity-60 ${focusClass}`}>Cancel</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {deleteError && <p role="alert" className={`mt-2 ${alertClass}`}>{deleteError}</p>}
      </div>

      <div className="mt-5 border-t border-white/20 pt-5">
        {!selectedId && !isCreateOpen && <p className="text-xs leading-5 text-slate-300">Select a conversation or start a new chat.</p>}
        {selectedId && isDetailLoading && <p role="status" className="text-xs text-slate-300">Loading conversation...</p>}
        {selectedId && detailError && <p role="alert" className={alertClass}>{detailError}</p>}
        {detail && (
          <div>
            <h3 className="break-words text-sm font-semibold">{detail.title}</h3>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">{courseLabel(detail.course_id)}</p>
            {detail.messages.length === 0 ? (
              <p className="mt-3 text-xs leading-5 text-slate-300">No messages yet. Ask your first question below.</p>
            ) : (
              <ol aria-label="Messages" className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {detail.messages.map(renderMessage)}
                <li aria-hidden="true"><div ref={endRef} /></li>
              </ol>
            )}
            <form onSubmit={handleSend} className="mt-4 space-y-2">
              <label htmlFor="assistant-message" className="text-xs font-semibold text-slate-200">Your message</label>
              <textarea id="assistant-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={4} disabled={isSending} placeholder="Help me prepare for my operating systems quiz" className={`w-full resize-y py-2.5 leading-6 ${inputClass}`} />
              <p className="text-right text-[11px] text-slate-300">{message.length} / {MAX_MESSAGE_LENGTH}</p>
              <button type="submit" disabled={!canSend} aria-busy={isSending} className={`min-h-11 w-full rounded-xl bg-[#f1b28d] px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#f6c4a6] disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}>{isSending ? "Thinking..." : "Send message"}</button>
              <p role="status" aria-live="polite" className="text-xs text-slate-300">{isSending ? "Sending your message and waiting for the tutor..." : ""}</p>
              {sendError && <p role="alert" className={alertClass}>{sendError}</p>}
            </form>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">AI-generated. Check important details against your course materials.</p>
          </div>
        )}
      </div>
    </section>
  );
}