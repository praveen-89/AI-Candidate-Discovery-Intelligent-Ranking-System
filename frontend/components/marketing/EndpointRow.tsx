import { cn } from "@/lib/utils/cn";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  POST: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
};

export function EndpointRow({ method, path, description }: { method: "GET" | "POST"; path: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-mkt-border py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <span
        className={cn(
          "inline-flex w-14 shrink-0 items-center justify-center rounded border px-2 py-0.5 text-[11px] font-semibold",
          METHOD_STYLES[method]
        )}
      >
        {method}
      </span>
      <code className="font-mono text-sm text-mkt-text">{path}</code>
      <span className="text-sm text-mkt-text-secondary sm:ml-auto">{description}</span>
    </div>
  );
}
