// DTOs matching the FastAPI response schemas in backend/app/schemas.py.

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  user_id: string;
  created_at: string;
};

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export type Assignment = {
  id: string;
  title: string;
  due_at: string;
  status: AssignmentStatus;
  course_id: string;
  created_at: string;
};

// Recurring weekly schedule item. weekday is Monday=0 through Sunday=6;
// start_time/end_time are "HH:MM:SS".
export type ScheduleItem = {
  id: string;
  title: string;
  weekday: number;
  start_time: string;
  end_time: string;
  location: string | null;
  course_id: string | null;
  user_id: string;
  created_at: string;
};

// FastAPI returns {"detail": "message"} for HTTP errors and
// {"detail": [{ loc, msg, type }, ...]} for request validation errors.
export type ValidationErrorItem = {
  loc?: (string | number)[];
  msg: string;
  type?: string;
};

export type ErrorResponse = {
  detail?: string | ValidationErrorItem[];
};

export type StudyAssistantChatRequest = {
  message: string;
  course_id: string | null;
};

export type StudyAssistantChatResponse = {
  answer: string;
  course_id: string | null;
};

export type StudyConversationSummary = {
  id: string;
  title: string;
  course_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StudyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type StudyConversationDetail = StudyConversationSummary & {
  messages: StudyMessage[];
};

export type StudyConversationCreateRequest = {
  course_id: string | null;
  title: string | null;
};

export type StudyMessageCreateRequest = {
  message: string;
};

export type StudyMessageExchange = {
  user_message: StudyMessage;
  assistant_message: StudyMessage;
  conversation: StudyConversationSummary;
};
