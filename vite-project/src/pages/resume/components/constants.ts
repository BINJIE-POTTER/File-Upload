import { type Block } from "../types";

/** Sidebar: add-block palette entries */
export const BLOCK_TYPES: { type: Block["type"]; label: string; desc: string }[] = [
  { type: "pi", label: "Personal Info", desc: "Name, contacts & avatar" },
  { type: "title", label: "Section Title", desc: "Heading with divider" },
  { type: "list", label: "List", desc: "Bullet or numbered items" },
  { type: "info", label: "Info Line", desc: "Left & right-aligned row" },
];

/** Primary color swatches (sidebar ColorPicker) */
export const COLOR_PRESETS = [
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#64748b",
] as const;

/** Text format toolbar swatches (editor TextFormatPanel) */
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

/** Font options for font selector */
export const FONT_OPTIONS = [
  { id: "sans", label: "Sans", fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', ui-sans-serif, system-ui, sans-serif" },
  { id: "serif", label: "Serif", fontFamily: "'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', ui-serif, Georgia, Cambria, serif" },
  { id: "mono", label: "Mono", fontFamily: "'Cascadia Code', 'Fira Code', ui-monospace, monospace" },
] as const;

/** Badge variants for insert panel + contenteditable badges */
export const BADGE_VARIANTS = ["default", "secondary", "outline"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

/** Same set as BADGE_VARIANTS — for validating `data-variant` on existing nodes */
export const EDITABLE_BADGE_VARIANTS = BADGE_VARIANTS;

/** DOM id for the temporary cursor marker when opening badge insert panel */
export const CE_CURSOR_MARKER_ID = "ce-badge-cursor-marker";
