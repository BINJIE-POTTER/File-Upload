import type { Block, AIResumeData } from "./types";
import type { FontId } from "./components/constants";

export type ResumeCtx = {
  /** 当前简历的所有区块 */
  blocks: Block[];
  /** 主题色 */
  color: string;
  /** 主题色浅色变体（用于徽章等） */
  lightColor: string;
  /** 主题色更浅变体（用于背景等） */
  extraLightColor: string;
  setColor: (c: string) => void;
  paddingH: number;
  paddingV: number;
  setPaddingH: (v: number) => void;
  setPaddingV: (v: number) => void;
  font: FontId;
  setFont: (f: FontId) => void;
  /** 添加新区块 */
  addBlock: (type: Block["type"]) => void;
  /** 更新指定 ID 的区块内容 */
  updateBlock: (id: string, updater: (cur: Block) => Block) => void;
  /** 移动相邻两个区块的位置 */
  moveBlock: (i: number, dir: -1 | 1) => void;
  /** 删除指定 ID 的区块 */
  removeBlock: (id: string) => void;
  /** AI 是否正在加载 */
  isLoading: boolean;
  /** 加载 AI 生成的简历数据（会保存历史快照） */
  loadAIResponse: (data: AIResumeData) => Promise<void>;
  /** 从 JSON 导入简历（会保存历史快照） */
  importFromJson: (data: AIResumeData) => void;
  /** 撤销最近一次不可逆操作 */
  undo: () => void;
  /** 重做最近一次被撤销的操作 */
  redo: () => void;
  /** 是否有可撤销的操作 */
  canUndo: boolean;
  /** 是否有可重做的操作 */
  canRedo: boolean;
};
