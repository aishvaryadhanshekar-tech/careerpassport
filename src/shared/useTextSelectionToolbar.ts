import { useEffect, useState, type RefObject } from "react";

export type TextSelectionToolbarState = {
  /** True while the textarea holds a non-collapsed selection. */
  active: boolean;
  /** Best-effort screen position for a floating toolbar near the selection. */
  position: { x: number; y: number } | null;
  selectionStart: number;
  selectionEnd: number;
};

const INACTIVE: TextSelectionToolbarState = {
  active: false,
  position: null,
  selectionStart: 0,
  selectionEnd: 0,
};

/**
 * Tracks whether a `<textarea>` currently has a non-collapsed text selection, for driving a
 * small floating "Rewrite" toolbar (see `SelectionRewriteButton`).
 *
 * Textareas have no native API for precise text-range geometry (that requires contentEditable +
 * the Range/Selection APIs), so this deliberately doesn't attempt pixel-perfect anchoring —
 * consistent with every other hand-rolled popover in this app (no Radix/Floating UI/Tippy
 * dependency exists here). Position comes from the triggering mouse event's client coordinates
 * when available (dragging with the mouse), falling back to the last known position — or a spot
 * near the textarea's top-right corner — for keyboard-driven selection (e.g. shift+arrow keys),
 * which carries no coordinates of its own.
 *
 * The selection is hidden/reset whenever it collapses, the textarea blurs, or `watchedValue`
 * changes underneath it — so a stale `selectionStart`/`selectionEnd` pair is never reported once
 * the text it referred to may have moved.
 */
export function useTextSelectionToolbar(
  ref: RefObject<HTMLTextAreaElement | null>,
  watchedValue?: string,
): TextSelectionToolbarState {
  const [state, setState] = useState<TextSelectionToolbarState>(INACTIVE);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function readSelection(clientX?: number, clientY?: number) {
      const node = ref.current;
      if (!node) return;
      const { selectionStart, selectionEnd } = node;
      if (selectionStart == null || selectionEnd == null || selectionStart === selectionEnd) {
        setState(INACTIVE);
        return;
      }
      setState((prev) => {
        const rect = node.getBoundingClientRect();
        const fallback = { x: rect.right - 12, y: rect.top + 12 };
        const position =
          clientX !== undefined && clientY !== undefined
            ? { x: clientX, y: clientY }
            : (prev.position ?? fallback);
        return { active: true, position, selectionStart, selectionEnd };
      });
    }

    function onMouseUp(e: MouseEvent) {
      readSelection(e.clientX, e.clientY);
    }

    function onKeyUp(e: KeyboardEvent) {
      // Only selection-driving keys — avoids recomputing (and repositioning near a stale
      // fallback) on every keystroke while the user is just typing.
      if (e.key === "Shift" || e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
        readSelection();
      }
    }

    function onSelect() {
      readSelection();
    }

    function onBlur() {
      setState(INACTIVE);
    }

    function onInput() {
      // The value changed underneath the current selection offsets — they're stale now.
      setState(INACTIVE);
    }

    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("select", onSelect);
    el.addEventListener("blur", onBlur);
    el.addEventListener("input", onInput);

    return () => {
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("select", onSelect);
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("input", onInput);
    };
  }, [ref]);

  // A programmatic value change (e.g. this same rewrite splicing new text back in) can happen
  // without ever firing the textarea's own `input` event — reset defensively so we never act on
  // offsets that no longer line up with the text they were captured against.
  useEffect(() => {
    setState(INACTIVE);
  }, [watchedValue]);

  return state;
}
