/** Join class names, ignoring falsy values. Tiny stand-in for clsx. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Format a date the way this journal keeps time: 2026.09.05 */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** Rough reading time at a contemplative 210 words per minute. */
export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 210));
  return `${minutes} min read`;
}