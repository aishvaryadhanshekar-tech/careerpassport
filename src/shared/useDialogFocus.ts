import { useEffect, useRef } from "react";

const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
const stack: HTMLElement[] = [];
/** Focus belongs to the top modal; nonmodal inspectors deliberately do not use this hook. */
export function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stack.push(dialog);
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable)).filter(el => el.getClientRects().length && !el.closest('[hidden], [inert]'));
    const frame = requestAnimationFrame(() => {
      if (stack.at(-1) === dialog && !dialog.contains(document.activeElement)) (controls()[0] ?? dialog).focus();
    });
    function key(event: globalThis.KeyboardEvent) {
      if (stack.at(-1) !== dialog) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0] ?? dialog;
      const last = items.at(-1) ?? dialog;
      if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    }
    function focus(event: FocusEvent) {
      if (stack.at(-1) === dialog && event.target instanceof Node && !dialog.contains(event.target)) (controls()[0] ?? dialog).focus();
    }
    document.addEventListener('keydown', key, true);
    document.addEventListener('focusin', focus);
    return () => {
      cancelAnimationFrame(frame);
      stack.splice(stack.indexOf(dialog), 1);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('focusin', focus);
      if (origin?.isConnected) origin.focus();
    };
  }, [open]);
  return ref;
}
