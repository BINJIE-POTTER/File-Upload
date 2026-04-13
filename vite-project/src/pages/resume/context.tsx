import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type Block, type AIResumeData, DEFAULTS, mkPI, mkTitle, mkList, mkInfo, lighten, convertAIResponse } from "./types";
import { FONT_OPTIONS, type FontId } from "./components/constants";
import { ResumeContext } from "./resumeContext";

const STORAGE_KEY = "resume-data";
/** 历史记录栈最大深度 */
const MAX_HISTORY = 50;

type PersistedResume = {
  blocks: Block[];
  color: string;
  paddingH: number;
  paddingV: number;
  font: FontId;
};

/**
 * 检测 localStorage 是否即将达到容量上限
 * @returns true 表示剩余空间不足，建议减少数据量
 */
function isStorageNearLimit(): boolean {
  try {
    const testKey = "__storage_quota_test__";
    let freeSpace = 0;
    for (let i = 0; i < 512 * 1024; i += 4096) {
      try {
        localStorage.setItem(testKey, "a".repeat(4096));
        localStorage.removeItem(testKey);
        freeSpace += 4096;
      } catch {
        break;
      }
    }
    // 剩余空间小于 512KB 认为接近上限
    return freeSpace < 512 * 1024;
  } catch {
    return true; // 无法检测，默认认为接近上限
  }
}

const loadResume = (): PersistedResume | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || !Array.isArray((data as PersistedResume).blocks)) return null;
    const d = data as Record<string, unknown>;
    const n = (v: unknown): number => (typeof v === "number" && !Number.isNaN(v) ? v : 15);
    const fallbackPadding = n(d.padding);
    return {
      blocks: d.blocks as Block[],
      color: (d.color as string) ?? "#3b82f6",
      paddingH: typeof d.paddingH === "number" ? d.paddingH : fallbackPadding,
      paddingV: typeof d.paddingV === "number" ? d.paddingV : fallbackPadding,
      font: FONT_OPTIONS.some((f) => f.id === d.font) ? (d.font as FontId) : "sans",
    };
  } catch {
    return null;
  }
};

const saveResume = (data: PersistedResume) => {
  try {
    // 容量接近上限时给出警告
    if (isStorageNearLimit()) {
      toast.warning("浏览器存储空间即将用尽，简历可能无法保存。请清理浏览器存储。");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // 可能是隐私模式或容量已满
    toast.error("简历保存失败，可能是存储空间已满。请清理浏览器数据后重试。");
    console.error("[resume] saveResume failed:", e);
  }
};

/**
 * ResumeContext - 简历全局状态 Context
 *
 * 提供简历编辑器的所有状态和操作方法：
 * - blocks: 区块列表
 * - 外观设置（color, paddingH, paddingV, font）
 * - 辅助颜色（lightColor, extraLightColor）
 * - AI 操作（isLoading, loadAIResponse, importFromJson, restoreBlocks）
 * - 区块操作（addBlock）
 *
 * 数据持久化：
 * - 所有状态自动保存到 localStorage
 * - 页面加载时自动恢复
 */
export function ResumeProvider({ children }: { children: React.ReactNode }) {
  // ── 从 localStorage 加载已保存的数据 ────────────────────────────────────
  const saved = loadResume();
  const restoredRef = useRef(!!saved);

  // ── 状态 ─────────────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<Block[]>(saved?.blocks ?? DEFAULTS);
  const [color, setColor] = useState(saved?.color ?? "#3b82f6");
  const [paddingH, setPaddingH] = useState(saved?.paddingH ?? 15);
  const [paddingV, setPaddingV] = useState(saved?.paddingV ?? 15);
  const [font, setFont] = useState<FontId>(saved?.font ?? "sans");

  // ── 撤销/重做历史栈 ───────────────────────────────────────────────────────
  /**
   * past - 已完成操作的历史快照（用于撤销）
   * future - 已撤销操作的历史快照（用于重做）
   * 使用函数式 setBlocks 保证历史记录的稳定性
   */
  const [history, setHistory] = useState<{ past: Block[][]; future: Block[][] }>({
    past: [],
    future: [],
  });

  /** 辅助颜色计算 */
  const lightColor = lighten(color, 0.85);
  const extraLightColor = lighten(color, 0.93);

  // ── 恢复提示 ──────────────────────────────────────────────────────────────
  const toastShownRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("简历已恢复");
    }
  }, []);

  // ── 自动保存到 localStorage ───────────────────────────────────────────────
  useEffect(() => {
    saveResume({ blocks, color, paddingH, paddingV, font });
  }, [blocks, color, paddingH, paddingV, font]);

  // ── 添加区块 ──────────────────────────────────────────────────────────────
  /**
   * 根据类型创建并添加新区块
   */
  const addBlock = useCallback((type: Block["type"]) => {
    const block = type === "pi" ? mkPI() : type === "title" ? mkTitle() : type === "list" ? mkList() : mkInfo();
    setBlocks((bs) => [...bs, block]);
  }, []);

  // ── 区块操作 ──────────────────────────────────────────────────────────────
  /**
   * 更新指定 ID 的区块内容
   */
  const updateBlock = useCallback((id: string, updater: (cur: Block) => Block) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? updater(b) : b)));
  }, []);

  /**
   * 移动相邻两个区块的位置
   */
  const moveBlock = useCallback((i: number, dir: -1 | 1) => {
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const a = [...bs];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  }, []);

  /**
   * 删除指定 ID 的区块
   */
  const removeBlock = useCallback((id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }, []);

  // ── AI 集成状态 ─────────────────────────────────────────────────────────
  /** 是否正在加载 AI 响应 */
  const [isLoading, setIsLoading] = useState(false);

  // ── 加载 AI 响应 ─────────────────────────────────────────────────────────
  /**
   * 模拟加载延迟，转换 AI 数据格式，用新数据替换区块
   * 调用前会先保存当前状态到历史栈
   */
  const loadAIResponse = useCallback(async (data: AIResumeData) => {
    // 保存当前快照后再覆盖（捕获此刻的 blocks 值）
    setHistory((h) => ({
      past: [...h.past.slice(-MAX_HISTORY + 1), blocks],
      future: [],
    }));
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setBlocks(convertAIResponse(data));
    setIsLoading(false);
    toast.success("AI 简历已加载");
  }, [blocks]);

  // ── 从 JSON 导入 ─────────────────────────────────────────────────────────
  /**
   * 立即从 JSON 数据导入（用于手动导入）
   * 调用前会先保存当前状态到历史栈
   */
  const importFromJson = useCallback((data: AIResumeData) => {
    setHistory((h) => ({
      past: [...h.past.slice(-MAX_HISTORY + 1), blocks],
      future: [],
    }));
    setBlocks(convertAIResponse(data));
    toast.success("简历已导入");
  }, [blocks]);

  // ── 撤销 ────────────────────────────────────────────────────────────────
  /**
   * 撤销最近一次不可逆操作，恢复到上一版
   */
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    setBlocks((current) => {
      setHistory((h) => ({
        past: h.past.slice(0, -1),
        future: [current, ...h.future],
      }));
      return prev;
    });
    toast.success("已撤销");
  }, [history.past]);

  // ── 重做 ────────────────────────────────────────────────────────────────
  /**
   * 重做最近一次被撤销的操作
   */
  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setBlocks((current) => {
      setHistory((h) => ({
        past: [...h.past, current],
        future: h.future.slice(1),
      }));
      return next;
    });
    toast.success("已重做");
  }, [history.future]);

  return (
    <ResumeContext.Provider
      value={{
        blocks,
        color,
        lightColor,
        extraLightColor,
        setColor,
        paddingH,
        paddingV,
        setPaddingH,
        setPaddingV,
        font,
        setFont,
        addBlock,
        updateBlock,
        moveBlock,
        removeBlock,
        isLoading,
        loadAIResponse,
        importFromJson,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
