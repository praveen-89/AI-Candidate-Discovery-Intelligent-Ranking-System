/**
 * Centralized API client for the AI Talent Intelligence Platform.
 * All fetch calls go through this module.
 * Base URL is read from NEXT_PUBLIC_API_BASE_URL env variable.
 */

import { createClient } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

/** Every protected backend route requires this — the signed-in user's Supabase access token. */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class APIClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "APIClientError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Core fetch wrapper with timeout, error normalisation and JSON parsing.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    const authHeader = await getAuthHeader();
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeader,
        ...(options.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new NetworkError(
        `Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s — is the FastAPI server running on port 8000?`
      );
    }
    throw new NetworkError(
      `Unable to reach the AI Talent Intelligence API at ${BASE_URL}. Make sure the FastAPI server is running.`
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      errorMessage = body.message ?? errorMessage;
    } catch {
      // ignore JSON parse failures on error responses
    }
    throw new APIClientError(response.status, errorMessage);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new NetworkError("Failed to parse API response as JSON.");
  }
}

/**
 * Multipart upload wrapper (file uploads — job description / resume files).
 * Deliberately does NOT set a Content-Type header: the browser sets
 * `multipart/form-data; boundary=...` itself when the body is a FormData.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    const authHeader = await getAuthHeader();
    response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: { Accept: "application/json", ...authHeader },
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new NetworkError(
        `Upload timed out after ${UPLOAD_TIMEOUT_MS / 1000}s — is the FastAPI server running on port 8000?`
      );
    }
    throw new NetworkError(
      `Unable to reach the AI Talent Intelligence API at ${BASE_URL}. Make sure the FastAPI server is running.`
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      errorMessage = body.message ?? errorMessage;
    } catch {
      // ignore JSON parse failures on error responses
    }
    throw new APIClientError(response.status, errorMessage);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new NetworkError("Failed to parse API response as JSON.");
  }
}
