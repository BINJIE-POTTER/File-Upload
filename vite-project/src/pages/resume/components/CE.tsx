import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { BadgeInsertPanel, createBadgeHtml, type BadgeVariant } from "./BadgeInsertPanel";
import { cn } from "@/lib/utils";
import { useResume } from "../context";

const EDITABLE_VARIANTS = ["default", "secondary", "outline"] as const;
const toEditableVariant = (v: string | null): BadgeVariant =>
  EDITABLE_VARIANTS.includes(v as BadgeVariant) ? (v as BadgeVariant) : "default";

/**
 * A controlled contenteditable field.
 * - DOM is managed imperatively (not via dangerouslySetInnerHTML) so React
 *   never clobbers text the user is actively typing.
 * - Calls onCommit(innerHTML) only on blur.
 * - Right-click shows badge insert panel; badge inserted at cursor, inline, no line-break.
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
  const { color, lightColor } = useResume();
  const [focused, setFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"insert" | "edit">("insert");
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [editState, setEditState] = useState<{ variant: BadgeVariant; text: string } | null>(null);
  const editTargetRef = useRef<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const pendingSelectionAfterRef = useRef<HTMLElement | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = html; }, []);

  useEffect(() => {
    if (ref.current && !focusedRef.current && !panelOpen) ref.current.innerHTML = html;
  }, [html, panelOpen]);

  /**
   * 聚焦
   */
  const handleFocus = () => { 
    focusedRef.current = true; 
    setFocused(true); 
  };
  /**
   * 失焦
   * @param e - The blur event.
   */
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    focusedRef.current = false;
    setFocused(false);

    const el = e.currentTarget;
    el.querySelectorAll("[data-badge-selected]").forEach((b) => b.removeAttribute("data-badge-selected"));
    if (!el.textContent?.trim()) el.innerHTML = "";
    onCommit(el.innerHTML);
  };

  const cursorMarkerId = "ce-badge-cursor-marker";

  /**
   * 插入光标标记到当前光标位置，用于插入 badge 后，光标自动定位到 badge 后面。
   */
  const insertCursorMarker = () => {
    const el = ref.current;
    const range = savedRangeRef.current;
    if (!el || !range) return;

    const marker = document.createElement("span");
    marker.setAttribute("data-badge-cursor-marker", cursorMarkerId);
    marker.contentEditable = "false";
    marker.className = "inline-block w-px min-h-[1em] align-middle bg-current";
    range.collapse(true);
    range.insertNode(marker);
  };

  const removeCursorMarker = () => {
    ref.current?.querySelector(`[data-badge-cursor-marker="${cursorMarkerId}"]`)?.remove();
  };

  const openInsertPanel = (e: React.MouseEvent) => {
    const sel = document.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    if (range && ref.current?.contains(range.commonAncestorContainer)) {
      editTargetRef.current = null;
      savedRangeRef.current = range;
      setPanelMode("insert");
      setEditState(null);
      setPanelPos({ x: e.clientX, y: e.clientY });
      setPanelOpen(true);
      setTimeout(insertCursorMarker, 0);
    }
  };

  const openEditPanel = (badge: HTMLElement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    editTargetRef.current = badge;
    badge.setAttribute("data-badge-selected", "true");
    const variant = toEditableVariant(badge.getAttribute("data-variant"));
    const text = badge.textContent ?? "";
    setPanelMode("edit");
    setEditState({ variant, text });
    const rect = badge.getBoundingClientRect();
    setPanelPos({ x: rect.left, y: rect.bottom + 4 });
    setPanelOpen(true);
    removeCursorMarker();
  };

  const clearEditSelection = () => {
    editTargetRef.current?.removeAttribute("data-badge-selected");
    editTargetRef.current = null;
  };

  /**
   * Handles the context menu event.
   * 双击 badge 打开编辑面板，否则打开插入面板。
   * @param e - The context menu event.
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest("[data-badge]");
    if (target) {
      openEditPanel(target as HTMLElement, e);
      return;
    }
    openInsertPanel(e);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    const badge = (e.target as HTMLElement).closest("[data-badge]");
    if (badge && ref.current?.contains(badge)) {
      openEditPanel(badge as HTMLElement, e);
    }
  };

  const handleBadgeConfirm = (variant: BadgeVariant, text: string) => {
    const el = ref.current;
    if (!el) return;

    if (panelMode === "edit" && editTargetRef.current) {
      const badge = editTargetRef.current;
      const replacement = createBadgeHtml(variant, text);
      const frag = document.createRange().createContextualFragment(replacement);
      const newBadge = frag.firstElementChild as HTMLElement;
      badge.replaceWith(frag);
      el.focus();
      clearEditSelection();
      if (newBadge) pendingSelectionAfterRef.current = newBadge;
    } else {
      const marker = el.querySelector(`[data-badge-cursor-marker="${cursorMarkerId}"]`);
      const range = document.createRange();
      if (marker) {
        range.setStartBefore(marker);
        range.collapse(true);
      } else {
        const r = savedRangeRef.current;
        if (!r) return;
    const frag = range.createContextualFragment(createBadgeHtml(variant, text) + "\u200B");
    const lastInserted = frag.lastChild ?? frag.firstChild;
    range.insertNode(frag);
    if (lastInserted) {
      range.setStartAfter(lastInserted);
      range.collapse(true);
      const sel = document.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
    }
    removeCursorMarker();

        range.setStart(r.startContainer, r.startOffset);
        range.collapse(true);
      }
      const frag = range.createContextualFragment(createBadgeHtml(variant, text) + "\u200B");
      const lastInserted = frag.lastChild ?? frag.firstChild;
      range.insertNode(frag);
      if (lastInserted) {
        range.setStartAfter(lastInserted);
        range.collapse(true);
        const sel = document.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
      }
      removeCursorMarker();
    }

    focusedRef.current = true;
    setFocused(true);
    el.focus();
    const nodeToSelectAfter = pendingSelectionAfterRef.current;
    if (nodeToSelectAfter) {
      pendingSelectionAfterRef.current = null;
      requestAnimationFrame(() => {
        if (!nodeToSelectAfter.isConnected) return;
        const range = document.createRange();
        range.setStartAfter(nodeToSelectAfter);
        range.collapse(true);
        const sel = document.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
    onCommit(el.innerHTML);
    setPanelOpen(false);
    savedRangeRef.current = null;
  };

  const handlePanelClose = () => {
    removeCursorMarker();
    clearEditSelection();
    setPanelOpen(false);
    savedRangeRef.current = null;
  };

  useEffect(() => {
    if (!panelOpen) return;
    const closePanel = () => {
      removeCursorMarker();
      clearEditSelection();
      setPanelOpen(false);
      savedRangeRef.current = null;
    };
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-badge-insert-panel]")) return;
      closePanel();
    };
    const handleFocusOutside = (e: FocusEvent) => {
      if ((e.target as HTMLElement)?.closest("[data-badge-insert-panel]")) return;
      closePanel();
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("focusin", handleFocusOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("focusin", handleFocusOutside);
    };
  }, [panelOpen]);

  const ceDiv = (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder}
      className={cn(
        "outline-none cursor-text rounded transition-all", 
        className,
      )}
      style={focused ? {
        outline: `2px solid ${color}35`,
        outlineOffset: "2px",
        borderRadius: "3px",
        backgroundColor: `${color}07`,
      } : {}}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContextMenu={handleContextMenu}
      onClick={handleBadgeClick}
    />
  );

  return (
    <>
      {ceDiv}
      {panelOpen &&
        createPortal(
          <div
            data-badge-insert-panel
            className="fixed z-50 rounded-md border bg-popover p-0 shadow-lg"
            style={{ left: panelPos.x, top: panelPos.y }}
            role="dialog"
            aria-label="Insert badge"
          >
            <BadgeInsertPanel
              key={panelMode === "edit" ? `edit-${editState?.text ?? ""}` : "insert"}
              onConfirm={handleBadgeConfirm}
              onClose={handlePanelClose}
              color={color}
              lightColor={lightColor}
              initialVariant={editState?.variant}
              initialText={editState?.text}
              isEdit={panelMode === "edit"}
            />
          </div>,
          document.body
        )}
    </>
  );
}
