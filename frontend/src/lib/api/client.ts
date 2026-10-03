// Shared client for the CampusPilot FastAPI backend.
// Centralizes the base URL, JSON requests, Bearer-token headers,
// API error parsing, and 401 handling. Token values are never logged.

import { clearAccessToken, getAccessToken } from "@/lib/api/auth";
import type { ErrorResponse, TokenResponse } from "@/lib/api/types";

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function getApiUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
}

function parseErrorMessage(body: ErrorResponse, status: number): string {
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    const messages = body.detail.map((item) => item.msg);
    if (messages.length > 0) return messages.join(" ");
  }
  return `The request failed (${status}). Please try again.`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit,
  onUnauthorized: () => void,
): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error("The CampusPilot API is not configured. Please try again later.");
  }

  const token = getAccessToken();
  if (!token) {
    onUnauthorized();
    throw new ApiRequestError("Please sign in to continue.", 401);
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  } catch {
    throw new Error("Unable to reach the CampusPilot API. Check your connection and try again.");
  }

  if (response.status === 401) {
    clearAccessToken();
    onUnauthorized();
    throw new ApiRequestError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let message = `The request failed (${response.status}). Please try again.`;
    try {
      message = parseErrorMessage((await response.json()) as ErrorResponse, response.status);
    } catch {
      // Use the generic status message when the API response is not JSON.
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The CampusPilot API returned an unexpected response.");
  }
}

// The token endpoint expects form data (OAuth2 password flow), not JSON,
// and must not send a Bearer header, so it does not go through apiRequest.
export async function requestAuthToken(email: string, password: string): Promise<TokenResponse> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new ApiRequestError("The sign-in service is unavailable. Please try again later.", 0);
  }

  const body = new URLSearchParams({ username: email, password });

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new Error("Unable to reach the sign-in service. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new ApiRequestError("The sign-in service is unavailable. Please try again later.", response.status);
  }

  return (await response.json()) as TokenResponse;
}
