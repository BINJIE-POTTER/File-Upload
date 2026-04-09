import React from "react";
import { ChevronUp, ChevronDown, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ── 内部辅助组件 ────────────────────────────────────────────────────────────
/**
 * PanelBtn - 面板内统一风格的按钮组件
 * 用于 BlockPanel 弹出框中的操作按钮
 */
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
 * BlockPanel - 区块控制面板组件
 *
 * 区块左侧边距的触发按钮，打开后显示操作菜单：
 * - 上移 / 下移 / 删除
 * - 可选的区块特定操作（如列表类型切换、添加项、头像形状等）
 *
 * @param onUp - 上移回调
 * @param onDown - 下移回调
 * @param onDel - 删除回调
 * @param children - 可选的区块特定操作内容
 * @param visible - 是否显示触发按钮（由父组件的 hover 状态控制）
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
      {/* 触发按钮 */}
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

      {/* 操作菜单 */}
      <PopoverContent side="left" align="center" sideOffset={8} className="w-auto p-1.5 min-w-36">
        <div className="flex flex-col gap-px">
          {/* 导航操作 */}
          <PanelBtn icon={ChevronUp}   label="Move up"      onClick={onUp}  />
          <PanelBtn icon={ChevronDown} label="Move down"    onClick={onDown} />
          <PanelBtn icon={Trash2}      label="Delete block" onClick={onDel} danger />

          {/* 区块特定操作（如列表类型、添加项、头像形状等） */}
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
