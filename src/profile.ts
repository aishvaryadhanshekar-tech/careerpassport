export const PROFILE = {
  name: "Alex Smith",
  email: "alexsmith@conte.example",
  initials: "AS",
} as const;

export function truncateEmail(email: string, max = 15): string {
  if (email.length <= max) return email;
  return `${email.slice(0, max)}…`;
}
