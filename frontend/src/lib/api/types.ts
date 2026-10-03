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
