// ============================================================
// Standard API wrapper returned by all backend endpoints
// ============================================================
export interface StandardResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

// ============================================================
// Generic API error returned from the backend on failure
// ============================================================
export interface APIError {
  status: "failed";
  message: string;
  details?: unknown;
}
