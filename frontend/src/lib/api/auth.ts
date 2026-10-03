// Access-token storage for the development JWT.
// Client-only: every function touches window.localStorage.
// Never log or expose the token value.

const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
