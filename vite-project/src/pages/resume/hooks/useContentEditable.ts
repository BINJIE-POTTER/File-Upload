import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createBadgeHtml } from "../components/editor/createBadgeHtml";
import type { BadgeVariant } from "../components/constants";
import { CE_CURSOR_MARKER_ID, EDITABLE_BADGE_VARIANTS } from "../components/constants";

const toEditableVariant = (v: string | null): BadgeVariant =>
  EDITABLE_BADGE_VARIANTS.includes(v as BadgeVariant) ? (v as BadgeVariant) : "default";

interface EditState {
  variant: BadgeVariant;
  text: string;
}

interface UseContentEditableOptions {
  html: string;
  onCommit: (h: string) => void;
}

/**
 * useContentEditable - 可编辑内容区域状态与逻辑 Hook
 *
 * 管理 CE (ContentEditable) 组件的所有状态和交互：
 * - 焦点状态管理
 * - 徽章插入/编辑面板的开关和位置
 * - 文本格式工具栏的开关和位置
 * - 光标范围保存与恢复（用于在 DOM 操作后恢复选区）
 * - 光标标记管理（在插入徽章时标记光标位置）
 * - 外部点击关闭面板
 * - selectionchange 事件监听（更新格式工具栏可见性）
 */
interface UseContentEditableReturn {
  focused: boolean;
  setFocused: (v: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  panelMode: "insert" | "edit";
  setPanelMode: (v: "insert" | "edit") => void;
  panelPos: { x: number; y: number };
  setPanelPos: (v: { x: number; y: number }) => void;
  editState: EditState | null;
  setEditState: (v: EditState | null) => void;
  formatPanelOpen: boolean;
  setFormatPanelOpen: (v: boolean) => void;
  formatPanelPos: { x: number; y: number };
  setFormatPanelPos: (v: { x: number; y: number }) => void;
  ref: React.RefObject<HTMLDivElement | null>;
  handleFocus: () => void;
  handleBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  handleBadgeClick: (e: React.MouseEvent) => void;
  handleBadgeConfirm: (variant: BadgeVariant, text: string) => void;
  handleFormat: (cmd: "bold" | "italic" | "color", value?: string) => void;
  handleFormatPanelClose: () => void;
  handlePanelClose: () => void;
  updateFormatPanel: () => void;
}

export function useContentEditable({
  html,
  onCommit,
}: UseContentEditableOptions): UseContentEditableReturn {
  // ── 状态 ─────────────────────────────────────────────────────────────────
  const [focused, setFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"insert" | "edit">("insert");
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [editState, setEditState] = useState<EditState | null>(null);
  const editTargetRef = useRef<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const pendingSelectionAfterRef = useRef<HTMLElement | null>(null);
  const [formatPanelOpen, setFormatPanelOpen] = useState(false);
  const [formatPanelPos, setFormatPanelPos] = useState({ x: 0, y: 0 });
  const savedFormatRangeRef = useRef<Range | null>(null);
  const updateFormatPanelRef = useRef(() => {});

  // ── 初始化：将 html 内容写入 DOM ──────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = html; }, []);

  // ── 非聚焦时同步外部 html 到 DOM（忽略用户在输入时的中间状态） ─────────────
  const handleFocus = useCallback(() => {
    focusedRef.current = true;
    setFocused(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    focusedRef.current = false;
    setFocused(false);

    const el = e.currentTarget;
    el.querySelectorAll("[data-badge-selected]").forEach((b) => b.removeAttribute("data-badge-selected"));
    if (!el.textContent?.trim()) el.innerHTML = "";
    onCommit(el.innerHTML);
  }, [onCommit]);

  // ── 插入光标标记 ──────────────────────────────────────────────────────────
  /**
   * 在当前保存的光标位置插入一个临时标记元素
   * 用于在插入徽章后，将光标定位到徽章后面
   */
  const insertCursorMarker = useCallback(() => {
    const el = ref.current;
    const range = savedRangeRef.current;
    if (!el || !range) return;

    const marker = document.createElement("span");
    marker.setAttribute("data-badge-cursor-marker", CE_CURSOR_MARKER_ID);
    marker.contentEditable = "false";
    marker.className = "inline-block w-px min-h-[1em] align-middle bg-current";
    range.collapse(true);
    range.insertNode(marker);
  }, []);

  // ── 移除光标标记 ──────────────────────────────────────────────────────────
  const removeCursorMarker = useCallback(() => {
    ref.current?.querySelector(`[data-badge-cursor-marker="${CE_CURSOR_MARKER_ID}"]`)?.remove();
  }, []);

  // ── 清除编辑选区状态 ──────────────────────────────────────────────────────
  const clearEditSelection = useCallback(() => {
    editTargetRef.current?.removeAttribute("data-badge-selected");
    editTargetRef.current = null;
  }, []);

  // ── 打开发送面板（在当前光标位置） ────────────────────────────────────────
  const openInsertPanel = useCallback((e: React.MouseEvent) => {
    const sel = document.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    if (range && ref.current?.contains(range.commonAncestorContainer)) {
      editTargetRef.current = null;
      savedRangeRef.current = range;
      setFormatPanelOpen(false);
      setPanelMode("insert");
      setEditState(null);
      setPanelPos({ x: e.clientX, y: e.clientY });
      setPanelOpen(true);
      setTimeout(insertCursorMarker, 0);
    }
  }, [insertCursorMarker]);

  // ── 打开编辑面板（编辑现有徽章） ──────────────────────────────────────────
  const openEditPanel = useCallback((badge: HTMLElement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFormatPanelOpen(false);
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
  }, [removeCursorMarker]);

  // ── 更新格式工具栏位置 ────────────────────────────────────────────────────
  /**
   * 根据当前选区更新格式工具栏的显示状态和位置
   * 选区为空、选中徽章内容、或面板打开时隐藏工具栏
   */
  const updateFormatPanel = useCallback(() => {
    const sel = document.getSelection();
    const el = ref.current;
    if (!el || !sel?.rangeCount || panelOpen) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      setFormatPanelOpen(false);
      savedFormatRangeRef.current = null;
      return;
    }
    const anc = range.commonAncestorContainer;
    const ancEl = anc.nodeType === 3 ? (anc as Text).parentElement : (anc as Element);
    const inBadge = ancEl?.closest("[data-badge]");
    if (!el.contains(anc) || inBadge) {
      setFormatPanelOpen(false);
      savedFormatRangeRef.current = null;
      return;
    }
    savedFormatRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    setFormatPanelPos({ x: rect.left + rect.width / 2, y: rect.top });
    setFormatPanelOpen(true);
  }, [panelOpen]);

  // ── 执行文本格式化 ────────────────────────────────────────────────────────
  /**
   * 执行 bold/italic/color 命令
   * 先恢复保存的选区，再执行 execCommand
   */
  const handleFormat = useCallback((cmd: "bold" | "italic" | "color", value?: string) => {
    const el = ref.current;
    const r = savedFormatRangeRef.current;
    if (!el || !r) return;
    el.focus();
    const sel = document.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(r);
    }
    if (cmd === "bold") document.execCommand("bold");
    else if (cmd === "italic") document.execCommand("italic");
    else if (cmd === "color" && value) document.execCommand("foreColor", false, value);
    onCommit(el.innerHTML);
  }, [onCommit]);

  // ── 关闭格式工具栏 ────────────────────────────────────────────────────────
  const handleFormatPanelClose = useCallback(() => {
    setFormatPanelOpen(false);
    savedFormatRangeRef.current = null;
  }, []);

  useEffect(() => {
    updateFormatPanelRef.current = updateFormatPanel;
  });

  // ── 右键菜单处理 ─────────────────────────────────────────────────────────
  /**
   * 右键点击徽章：打开发辑面板
   * 右键点击其他位置：打开插入面板
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest("[data-badge]");
    if (target) {
      openEditPanel(target as HTMLElement, e);
      return;
    }
    openInsertPanel(e);
  }, [openEditPanel, openInsertPanel]);

  // ── 徽章点击处理 ─────────────────────────────────────────────────────────
  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    const badge = (e.target as HTMLElement).closest("[data-badge]");
    if (badge && ref.current?.contains(badge)) {
      openEditPanel(badge as HTMLElement, e);
    }
  }, [openEditPanel]);

  // ── 确认徽章（插入或更新） ────────────────────────────────────────────────
  /**
   * 插入模式：在保存的光标位置插入新徽章
   * 编辑模式：替换现有徽章
   * 插入后恢复光标位置到徽章后面
   */
  const handleBadgeConfirm = useCallback((variant: BadgeVariant, text: string) => {
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
      const marker = el.querySelector(`[data-badge-cursor-marker="${CE_CURSOR_MARKER_ID}"]`);
      const range = document.createRange();
      if (marker) {
        range.setStartBefore(marker);
        range.collapse(true);
      } else {
        const r = savedRangeRef.current;
        if (!r) return;
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
  }, [panelMode, clearEditSelection, removeCursorMarker, onCommit]);

  // ── 关闭面板 ──────────────────────────────────────────────────────────────
  const handlePanelClose = useCallback(() => {
    removeCursorMarker();
    clearEditSelection();
    setPanelOpen(false);
    savedRangeRef.current = null;
  }, [removeCursorMarker, clearEditSelection]);

  // ── 面板外部点击关闭 ─────────────────────────────────────────────────────
  // 徽章插入面板
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
  }, [panelOpen, removeCursorMarker, clearEditSelection]);

  // ── 格式工具栏外部点击关闭 ────────────────────────────────────────────────
  useEffect(() => {
    if (!formatPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-text-format-panel]")) return;
      handleFormatPanelClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formatPanelOpen, handleFormatPanelClose]);

  // ── 选区变化监听 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleSelectionChange = () => updateFormatPanelRef.current();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return {
    focused,
    setFocused,
    panelOpen,
    setPanelOpen,
    panelMode,
    setPanelMode,
    panelPos,
    setPanelPos,
    editState,
    setEditState,
    formatPanelOpen,
    setFormatPanelOpen,
    formatPanelPos,
    setFormatPanelPos,
    ref,
    handleFocus,
    handleBlur,
    handleContextMenu,
    handleBadgeClick,
    handleBadgeConfirm,
    handleFormat,
    handleFormatPanelClose,
    handlePanelClose,
    updateFormatPanel,
  };
}