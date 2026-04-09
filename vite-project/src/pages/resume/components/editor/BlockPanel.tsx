import React from "react";
import { ChevronUp, ChevronDown, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ── Internal helper ───────────────────────────────────────────────────────────
/** Uniform button row used inside the panel popover. */
function PanelBtn({
  icon: Icon, label, onClick, danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md w-full text-left transition-colors",
        danger ? "text-gray-600 hover:bg-red-50 hover:text-red-500"
               : "text-gray-600 hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <Icon size={11} className="shrink-0" />
      {label}
    </button>
  );
}

// ── BlockPanel ────────────────────────────────────────────────────────────────
/**
 * A single trigger button in the block's left gutter that opens a Popover
 * containing move-up / move-down / delete and optional block-specific controls.
 *
 * `visible` is driven by the block's JS hover state (useDebounceHover) so the
 * trigger remains shown whenever the mouse is anywhere inside the block —
 * including over a focused CE field — without relying on CSS group-hover.
 */
export function BlockPanel({
  onUp, onDown, onDel,
  children,
  visible,
}: {
  onUp: () => void;
  onDown: () => void;
  onDel: () => void;
  children?: React.ReactNode;
  visible: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "no-print absolute left-0 inset-y-0 my-auto h-fit z-10 translate-y-0.5",
            "p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-white/80",
            "transition-opacity duration-150",
            visible ? "opacity-100" : "opacity-0"
          )}
          aria-label="Block controls"
        >
          <MoreVertical size={13} />
        </button>
      </PopoverTrigger>

      <PopoverContent side="left" align="center" sideOffset={8} className="w-auto p-1.5 min-w-36">
        <div className="flex flex-col gap-px">
          {/* ── Navigation ── */}
          <PanelBtn icon={ChevronUp}   label="Move up"      onClick={onUp}  />
          <PanelBtn icon={ChevronDown} label="Move down"    onClick={onDown} />
          <PanelBtn icon={Trash2}      label="Delete block" onClick={onDel} danger />

          {/* ── Block-specific options (list type, add item, avatar shape…) ── */}
          {children && (
            <>
              <div className="border-t border-gray-100 my-1" />
              {children}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
