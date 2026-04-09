import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useResume } from "../../useResume";
import { useContentEditable } from "../../hooks/useContentEditable";
import { BadgeInsertPanel } from "./BadgeInsertPanel";
import { TextFormatPanel } from "./TextFormatPanel";

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
          if (text) document.execCommand("insertText", false, text);
        }}
      />

      {/* 文本格式工具栏（通过 Portal 渲染到 body） */}
      {formatPanelOpen && createPortal(
        <div
          className="fixed z-50"
          style={{
            left: formatPanelPos.x,
            top: formatPanelPos.y - 8,
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
      )}
      {panelOpen && createPortal(
        <div
          data-badge-insert-panel
          className="fixed z-50 rounded-md border bg-popover p-0 shadow-lg"
          style={{ left: panelPos.x, top: panelPos.y }}
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
      )}
    </>
  );
}