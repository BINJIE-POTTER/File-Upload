import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useResume } from "../../context";
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
 * A controlled contenteditable field.
 * - DOM is managed imperatively (not via dangerouslySetInnerHTML) so React
 *   never clobbers text the user is actively typing.
 * - Calls onCommit(innerHTML) only on blur.
 * - Right-click shows badge insert panel; badge inserted at cursor, inline, no line-break.
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

  return (
    <>
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