import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type Block, type AIResumeData, DEFAULTS, mkPI, mkTitle, mkList, lighten, convertAIResponse } from "./types";

const STORAGE_KEY = "resume-data";

export const FONT_OPTIONS = [
  { id: "sans", label: "Sans", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  { id: "serif", label: "Serif", fontFamily: "ui-serif, Georgia, Cambria, serif" },
  { id: "mono", label: "Mono", fontFamily: "ui-monospace, 'Cascadia Code', monospace" },
] as const;
export type FontId = (typeof FONT_OPTIONS)[number]["id"];

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

type ResumeCtx = {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  color: string;
  lightColor: string;
  setColor: (c: string) => void;
  paddingH: number;
  paddingV: number;
  setPaddingH: (v: number) => void;
  setPaddingV: (v: number) => void;
  font: FontId;
  setFont: (f: FontId) => void;
  addBlock: (type: Block["type"]) => void;
  /** True while AI response is being processed. */
  isLoading: boolean;
  /** Converts AI JSON to blocks and replaces the current resume. */
  loadAIResponse: (data: AIResumeData) => Promise<void>;
  /** Restores user's previous blocks (before AI replaced them). */
  restoreBlocks: () => void;
  /** True when a previous snapshot exists and can be restored. */
  canRestore: boolean;
};

const Ctx = createContext<ResumeCtx>(null!);

/** Access the shared resume state from any child component. */
export const useResume = () => useContext(Ctx);

/** Provides global resume state (blocks, colour, padding) to the component tree. */
export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const saved = loadResume();
  const restoredRef = useRef(!!saved);

  const [blocks, setBlocks] = useState<Block[]>(saved?.blocks ?? DEFAULTS);
  const [color, setColor] = useState(saved?.color ?? "#3b82f6");
  const [paddingH, setPaddingH] = useState(saved?.paddingH ?? 15);
  const [paddingV, setPaddingV] = useState(saved?.paddingV ?? 15);
  const [font, setFont] = useState<FontId>(saved?.font ?? "sans");

  const lightColor = lighten(color, 0.85);

  const toastShownRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Resume restored");
    }
  }, []);

  useEffect(() => {
    saveResume({ blocks, color, paddingH, paddingV, font });
  }, [blocks, color, paddingH, paddingV, font]);

  const addBlock = useCallback((type: Block["type"]) => {
    const block = type === "pi" ? mkPI() : type === "title" ? mkTitle() : mkList();
    setBlocks((bs) => [...bs, block]);
  }, []);

  // ── AI integration state ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  /** Snapshot of blocks before AI overwrites them, enabling restore. */
  const [prevBlocks, setPrevBlocks] = useState<Block[] | null>(null);

  /** Simulates loading delay, converts AI data, and replaces blocks. */
  const loadAIResponse = useCallback(async (data: AIResumeData) => {
    setPrevBlocks(blocks);
    setIsLoading(true);
    // Simulate network latency (will be replaced by real Dify call later)
    await new Promise((r) => setTimeout(r, 1200));
    setBlocks(convertAIResponse(data));
    setIsLoading(false);
    toast.success("AI resume loaded");
  }, [blocks]);

  /** Restores the snapshot taken before the last AI load. */
  const restoreBlocks = useCallback(() => {
    if (!prevBlocks) return;
    setBlocks(prevBlocks);
    setPrevBlocks(null);
    toast.success("Previous resume restored");
  }, [prevBlocks]);

  return (
    <Ctx.Provider
      value={{
        blocks,
        setBlocks,
        color,
        lightColor,
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
        restoreBlocks,
        canRestore: !!prevBlocks,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
