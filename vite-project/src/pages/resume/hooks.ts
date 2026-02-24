import { useState, useRef } from "react";

/**
 * Debounced hover state.
 * The `ms` grace period prevents the visible controls from flickering when
 * the mouse briefly crosses a gap (e.g. moving from a CE field to the gutter).
 */
export const useDebounceHover = (ms = 120) => {
  const [on, setOn] = useState(false);
  const t = useRef<number | undefined>(undefined);
  return {
    hovered:      on,
    onMouseEnter: () => { t.current = window.setTimeout(() => setOn(true), ms); },
    onMouseLeave: () => { clearTimeout(t.current); setOn(false); },
  };
};
