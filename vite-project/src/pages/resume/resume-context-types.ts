import type React from "react";
import type { Block, AIResumeData } from "./types";
import type { FontId } from "./components/constants";

export type ResumeCtx = {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  color: string;
  lightColor: string;
  extraLightColor: string;
  setColor: (c: string) => void;
  paddingH: number;
  paddingV: number;
  setPaddingH: (v: number) => void;
  setPaddingV: (v: number) => void;
  font: FontId;
  setFont: (f: FontId) => void;
  addBlock: (type: Block["type"]) => void;
  isLoading: boolean;
  loadAIResponse: (data: AIResumeData) => Promise<void>;
  importFromJson: (data: AIResumeData) => void;
  restoreBlocks: () => void;
  canRestore: boolean;
};
