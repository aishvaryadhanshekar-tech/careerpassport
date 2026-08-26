import type { Attachment } from "./types";

export const ACCEPT =
  ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.webm,.ogg";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 10;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function kindFor(file: File): Attachment["kind"] {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("text") ||
    file.name.match(/\.(pdf|docx?|txt|md)$/i)
  ) {
    return "document";
  }
  return "other";
}

export function ingestFiles(
  incoming: File[],
  currentCount: number,
): { accepted: File[]; errors: string[] } {
  const errors: string[] = [];
  const accepted: File[] = [];
  for (const file of incoming) {
    if (file.size === 0 && file.type === "") continue;
    if (currentCount + accepted.length >= MAX_FILES) {
      errors.push(`You can attach up to ${MAX_FILES} files.`);
      break;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`“${file.name}” is over 25 MB.`);
      continue;
    }
    accepted.push(file);
  }
  return { accepted, errors };
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
