/**
 * Tiny cn() utility — merges Tailwind class strings without clsx/tailwind-merge overhead.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
