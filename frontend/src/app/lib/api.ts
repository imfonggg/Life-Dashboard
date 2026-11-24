// Everything the frontend needs to talk to the FastAPI backend.

export const API_URL = "http://localhost:8000";

const TOKEN_KEY = "access_token";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Headers for a logged-in request. Pass json=true when sending a JSON body. */
export const authHeaders = (token: string, json = false): HeadersInit =>
  json
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}` };

/** The backend's error message from a failed response body, or the fallback if it has none. */
export const errorDetail = (body: unknown, fallback: string): string => {
  const detail = (body as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" ? detail : fallback;
};

/** The message from a caught error, or the fallback for anything that is not an Error. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** A JSON array from the API, or [] if the response was something else. */
export function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}
