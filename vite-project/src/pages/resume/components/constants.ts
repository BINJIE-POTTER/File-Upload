import { type Block } from "../types";

/**
 * 侧边栏「添加区块」按钮的配置
 * 定义可添加的区块类型及其描述信息
 */
export const BLOCK_TYPES: { type: Block["type"]; label: string; desc: string }[] = [
  { type: "pi", label: "Personal Info", desc: "Name, contacts & avatar" },
  { type: "title", label: "Section Title", desc: "Heading with divider" },
  { type: "list", label: "List", desc: "Bullet or numbered items" },
  { type: "info", label: "Info Line", desc: "Left & right-aligned row" },
];

/**
 * 预设主色调调色板（侧边栏 ColorPicker 使用）
 */
export const COLOR_PRESETS = [
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#64748b",
] as const;

/**
 * 文本格式工具栏的颜色预设（editor/TextFormatPanel 使用）
 */
export const TEXT_FORMAT_PRESET_COLORS = [
  "#000000",
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;

/**
 * 字体选项配置（侧边栏 FontSelector 使用）
 * id: 字体标识符
 * label: 显示名称
 * fontFamily: CSS font-family 字符串
 */
export const FONT_OPTIONS = [
  { id: "sans", label: "Sans", fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', ui-sans-serif, system-ui, sans-serif" },
  { id: "serif", label: "Serif", fontFamily: "'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', ui-serif, Georgia, Cambria, serif" },
  { id: "mono", label: "Mono", fontFamily: "'Cascadia Code', 'Fira Code', ui-monospace, monospace" },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

/**
 * 徽章变体类型（用于插入面板和 contenteditable 徽章）
 */
export const BADGE_VARIANTS = ["default", "secondary", "outline"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

/**
 * 与 BADGE_VARIANTS 相同，用于验证现有节点上的 data-variant 属性
 */
export const EDITABLE_BADGE_VARIANTS = BADGE_VARIANTS;

/**
 * 在打开徽章插入面板时，用于标记光标位置的临时 DOM 元素 ID
 */
export const CE_CURSOR_MARKER_ID = "ce-badge-cursor-marker";
