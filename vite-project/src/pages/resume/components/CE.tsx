import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useResume } from "../context";

/**
 * A controlled contenteditable field.
 * - DOM is managed imperatively (not via dangerouslySetInnerHTML) so React
 *   never clobbers text the user is actively typing.
 * - Calls onCommit(innerHTML) only on blur.
 */
export function CE({
  html,
  onCommit,
  className,
  placeholder,
}: {
  html: string;
  onCommit: (h: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const { color } = useResume();
  const [focused, setFocused] = useState(false);
  const ref       = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false); // ref so effects don't re-run on focus changes

  // Write initial HTML before the first paint — prevents a blank flash
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = html; }, []);

  // Sync parent → DOM only when the field is not focused (never clobber user input)
  useEffect(() => {
    if (ref.current && !focusedRef.current) ref.current.innerHTML = html;
  }, [html]);

  const handleFocus = () => { focusedRef.current = true;  setFocused(true);  };
  const handleBlur  = (e: React.FocusEvent<HTMLDivElement>) => {
    focusedRef.current = false;
    setFocused(false);
    const el = e.currentTarget;
    if (!el.textContent?.trim()) el.innerHTML = ""; // normalise truly-empty fields
    onCommit(el.innerHTML);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder}
      className={cn("outline-none cursor-text rounded transition-all", className)}
      style={focused ? {
        outline: `2px solid ${color}35`,
        outlineOffset: "2px",
        borderRadius: "3px",
        backgroundColor: `${color}07`,
      } : {}}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
