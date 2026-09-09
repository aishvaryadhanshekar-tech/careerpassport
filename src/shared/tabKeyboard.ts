import type { KeyboardEvent } from "react";

/** Standard tab navigation; activating an existing button retains its owner's state logic. */
export function tabKeyboard(event: KeyboardEvent<HTMLElement>) {
  if (!(event.target instanceof HTMLElement) || event.target.getAttribute('role') !== 'tab') return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(tab => !tab.disabled);
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  const vertical = event.currentTarget.getAttribute('aria-orientation') === 'vertical';
  const next = vertical ? 'ArrowDown' : 'ArrowRight';
  const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
  let destination: number;
  if (event.key === next) destination = (index + 1) % tabs.length;
  else if (event.key === previous) destination = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') destination = 0;
  else if (event.key === 'End') destination = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[destination]?.focus();
  tabs[destination]?.click();
  tabs[destination]?.scrollIntoView({block: 'nearest', inline: 'nearest'});
}
