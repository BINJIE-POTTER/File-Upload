import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type Block, type AIResumeData, DEFAULTS, mkPI, mkTitle, mkList, mkInfo, lighten, convertAIResponse } from "./types";
import { FONT_OPTIONS, type FontId } from "./components/constants";
import { ResumeContext } from "./resumeContext";

const STORAGE_KEY = "resume-data";

type PersistedResume = {
  blocks: Block[];
  color: string;
  paddingH: number;
  paddingV: number;
  font: FontId;
};

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    toast.error("Failed to save resume");
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

  // ── 辅助颜色计算 ─────────────────────────────────────────────────────────
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

  // ── AI 集成状态 ─────────────────────────────────────────────────────────
  /** 是否正在加载 AI 响应 */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * AI 覆盖前的区块快照，用于恢复
   */
  const [prevBlocks, setPrevBlocks] = useState<Block[] | null>(null);

  // ── 加载 AI 响应 ─────────────────────────────────────────────────────────
  /**
   * 模拟加载延迟，转换 AI 数据格式，用新数据替换区块
   */
  const loadAIResponse = useCallback(async (data: AIResumeData) => {
    setPrevBlocks(blocks);
    setIsLoading(true);
    // 模拟网络延迟（后续会替换为真实的 Dify API 调用）
    await new Promise((r) => setTimeout(r, 1200));
    setBlocks(convertAIResponse(data));
    setIsLoading(false);
    toast.success("AI 简历已加载");
  }, [blocks]);

  // ── 恢复上一版 ─────────────────────────────────────────────────────────
  /**
   * 恢复 AI 覆盖前的区块快照
   */
  const restoreBlocks = useCallback(() => {
    if (!prevBlocks) return;
    setBlocks(prevBlocks);
    setPrevBlocks(null);
    toast.success("上一版简历已恢复");
  }, [prevBlocks]);

  // ── 从 JSON 导入 ─────────────────────────────────────────────────────────
  /**
   * 立即从 JSON 数据导入（用于手动导入）
   */
  const importFromJson = useCallback((data: AIResumeData) => {
    setPrevBlocks(blocks);
    setBlocks(convertAIResponse(data));
    toast.success("简历已导入");
  }, [blocks]);

  return (
    <ResumeContext.Provider
      value={{
        blocks,
        setBlocks,
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
        isLoading,
        loadAIResponse,
        importFromJson,
        restoreBlocks,
        canRestore: !!prevBlocks,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
