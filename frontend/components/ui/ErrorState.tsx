"use client";

import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { NetworkError, APIClientError } from "@/lib/api/client";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

function getErrorInfo(error: unknown): { title: string; message: string; isNetwork: boolean } {
  if (error instanceof NetworkError) {
    return {
      title: "Backend Unavailable",
      message:
        "Unable to connect to the AI Talent Intelligence API. Make sure the FastAPI server is running:\n\nuvicorn app.main:app --reload",
      isNetwork: true,
    };
  }
  if (error instanceof APIClientError) {
    if (error.statusCode === 404) {
      return {
        title: "Not Found",
        message: error.message,
        isNetwork: false,
      };
    }
    if (error.statusCode === 500) {
      return {
        title: "Server Error",
        message: error.message,
        isNetwork: false,
      };
    }
    return {
      title: `API Error (${error.statusCode})`,
      message: error.message,
      isNetwork: false,
    };
  }
  return {
    title: "Unexpected Error",
    message: error instanceof Error ? error.message : "An unknown error occurred.",
    isNetwork: false,
  };
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { title, message, isNetwork } = getErrorInfo(error);
  const Icon = isNetwork ? WifiOff : AlertTriangle;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <Icon className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md whitespace-pre-line text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}
