import { badgeVariants } from "@/components/ui/badge";
import type { BadgeVariant } from "../constants";

/**
 * createBadgeHtml - 生成徽章的 HTML 字符串
 *
 * 用于在 contenteditable 中插入徽章元素
 *
 * @param variant - 徽章样式变体（default/secondary/outline）
 * @param text - 徽章显示文本
 * @returns HTML 字符串，包含 contenteditable="false" 的 span 元素
 */
export function createBadgeHtml(variant: BadgeVariant, text: string): string {
  const cls = badgeVariants({ variant }) + " leading-none";
  const style = "vertical-align:middle line-height:1";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<span contenteditable="false" data-badge data-variant="${variant}" class="${cls}" style="${style}">${escaped}</span>`;
}
