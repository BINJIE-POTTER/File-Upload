import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useResume } from "../../useResume";
import { useContentEditable } from "../../hooks/useContentEditable";
import { BadgeInsertPanel } from "./BadgeInsertPanel";
import { TextFormatPanel } from "./TextFormatPanel";

/**
 * clampToViewport - 将面板位置限制在视口内
 *
 * @param x - 面板期望的左坐标
 * @param y - 面板期望的顶坐标
 * @param panelW - 面板宽度
 * @param panelH - 面板高度
 * @param offset - 偏移量（防止紧贴边缘）
 * @returns 限制后的 { x, y }
 */
function clampToViewport(x: number, y: number, panelW: number, panelH: number, offset = 8): { x: number; y: number } {
  const vw = globalThis.innerWidth;
  const vh = globalThis.innerHeight;
  return {
    x: Math.min(Math.max(offset, x), vw - panelW - offset),
    y: Math.min(Math.max(offset, y), vh - panelH - offset),
  };
}

type CEProps = {
  html: string;
  onCommit: (h: string) => void;
  className?: string;
  placeholder?: string;
};

/**
 * CE - 可编辑内容区域组件
 *
 * 一个受控的 contenteditable 字段：
 * - DOM 通过命令式管理（不是 dangerouslySetInnerHTML），避免 React 破坏用户正在输入的内容
 * - 仅在失焦时调用 onCommit(innerHTML)
 * - 右键显示徽章插入面板；徽章在光标位置内联插入，不换行
 *
 * @param html - HTML 内容
 * @param onCommit - 提交回调（失焦时传入新的 innerHTML）
 * @param className - 可选的额外类名
 * @param placeholder - 占位符
 */
export function CE({ html, onCommit, className, placeholder }: CEProps) {
  const { color, lightColor } = useResume();
  const {
    focused,
    panelOpen,
    panelMode,
    panelPos,
    editState,
    formatPanelOpen,
    formatPanelPos,
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
  } = useContentEditable({ html, onCommit });

  // ── 渲染 ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* 可编辑区域 */}
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
        onMouseUp={updateFormatPanel}
        onContextMenu={handleContextMenu}
        onClick={handleBadgeClick}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData?.getData("text/plain") ?? "";
          if (!text) return;
          // 使用现代 Selection/Range API 替代已废弃的 execCommand("insertText")
          const sel = document.getSelection();
          if (!sel?.rangeCount) return;
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          // 将光标移动到插入文本之后
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }}
      />

      {/* 文本格式工具栏（通过 Portal 渲染到 body） */}
      {formatPanelOpen && (() => {
        // 格式工具栏估算尺寸（实际由内容决定，这里用典型值做初始边界约束）
        const FORMAT_H = 40;
        const FORMAT_W = 220;
        const pos = clampToViewport(
          formatPanelPos.x,
          formatPanelPos.y - 8,
          FORMAT_W,
          FORMAT_H
        );
        return createPortal(
          <div
            className="fixed z-50"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <TextFormatPanel
              onFormat={handleFormat}
              onClose={handleFormatPanelClose}
              primaryColor={color}
            />
          </div>,
          document.body
        );
      })()}
      {panelOpen && (() => {
        // 徽章面板尺寸：w-64 = 16rem ≈ 256px，height ≈ 160px
        const BADGE_W = 256;
        const BADGE_H = 160;
        const pos = clampToViewport(panelPos.x, panelPos.y, BADGE_W, BADGE_H);
        return createPortal(
          <div
            data-badge-insert-panel
            className="fixed z-50 rounded-md border bg-popover p-0 shadow-lg"
            style={{ left: pos.x, top: pos.y }}
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
        );
      })()}
    </>
  );
}