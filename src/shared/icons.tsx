import type { JSX } from "react";

/**
 * Shared inline SVG icons.
 *
 * These were previously copy-pasted into each consumer — `SparkleIcon` alone had five
 * byte-identical definitions. Import from here instead of redeclaring locally, so an icon
 * change is a one-file change.
 */

export function SparkleIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 9.3 5 12.8 6.3 9.3 7.6 8 11.1 6.7 7.6 3.2 6.3 6.7 5 8 1.5Z"
        fill="currentColor"
      />
      <path
        d="M13 9.5 13.6 11.1 15.2 11.7 13.6 12.3 13 13.9 12.4 12.3 10.8 11.7 12.4 11.1 13 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlusIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1.5V12.5M1.5 7H12.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
