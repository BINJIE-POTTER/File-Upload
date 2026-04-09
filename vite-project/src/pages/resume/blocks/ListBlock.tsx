import React from "react";
import { Trash2, Plus } from "lucide-react";
import { uid, type Block, type ListBlock } from "../types";
import { useResume } from "../useResume";
import { CE } from "../components/editor/CE";
import { BlockPanel } from "../components/editor/BlockPanel";
import { useDebounceHover } from "../hooks";

// ── 子组件 ───────────────────────────────────────────────────────────────────

/**
 * BulletDot - 实心圆点（项目符号）
 * 使用主题色的实心圆，强制打印颜色
 */
function BulletDot({ color }: { color: string }) {
  return (
    <span
      className="shrink-0 mt-2"
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}
    />
  );
}

/**
 * NumberBadge - 编号圆圈
 * 带主题色背景的编号圆圈，强制打印颜色
 */
function NumberBadge({ n, color, lightColor }: { n: number; color: string; lightColor: string }) {
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center font-semibold mt-1"
      style={{
        width: "1.35em", height: "1.35em",
        borderRadius: "50%",
        background: lightColor,
        color,
        fontSize: "0.68em",
        lineHeight: 1,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {n}
    </span>
  );
}

// ── 面板内容组件（私有）────────────────────────────────────────────────────
/**
 * ListPanelContent - 列表区块的特定操作面板
 * 用于：切换项目符号/编号模式、添加新项
 */
function ListPanelContent({
  b, set,
}: {
  b: ListBlock;
  set: (fn: (cur: Block) => Block) => void;
}) {
  const { color } = useResume();

  return (
    <>
      {/* 项目符号/编号切换 */}
      <div className="flex gap-1 p-1">
        {(["bullet", "number"] as const).map((type) => (
          <button
            key={type}
            onClick={() => set(cur => ({ ...(cur as ListBlock), iconType: type }))}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-colors"
            style={b.iconType === type
              ? { background: color, color: "white" }
              : { border: "1px solid #e5e7eb", color: "#9ca3af" }
            }
          >
            {type === "bullet" ? "● Bullet" : "① Number"}
          </button>
        ))}
      </div>

      {/* 添加项按钮 */}
      <button
        className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md w-full"
        onClick={() => set(cur => ({
          ...(cur as ListBlock),
          items: [...(cur as ListBlock).items, { id: uid(), html: "" }],
        }))}
      >
        <Plus size={11} /> Add item
      </button>
    </>
  );
}

// ── View ──────────────────────────────────────────────────────────────────────
/**
 * ListView - 列表区块视图
 *
 * 支持两种模式：
 * - 项目符号列表（实心圆点）
 * - 编号列表（带编号的圆圈）
 *
 * @param b - 区块数据
 * @param set - 区块更新函数
 * @param onUp/onDown/onDel - 区块操作（上移/下移/删除）
 */
export function ListView({
  b, set, onUp, onDown, onDel,
}: {
  b: ListBlock;
  set: (fn: (cur: Block) => Block) => void;
  onUp: () => void;
  onDown: () => void;
  onDel: () => void;
}) {
  const { color, lightColor } = useResume();
  const { hovered, onMouseEnter, onMouseLeave } = useDebounceHover();

  return (
    <div
      className="group relative pt-1 -ml-8 pl-8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered}>
        <ListPanelContent b={b} set={set} />
      </BlockPanel>

      {/* 列表项 */}
      <div className="space-y-1.5 pl-1">
        {b.items.map((item, i) => (
          // relative + pr-5：删除按钮绝对定位，不占用布局空间
          <div key={item.id} className="group/item relative flex items-start gap-2.5">
            {b.iconType === "bullet"
              ? <BulletDot color={color} />
              : <NumberBadge n={i + 1} color={color} lightColor={lightColor} />
            }
            <CE
              html={item.html}
              onCommit={(v) => set(cur => {
                const its = [...(cur as ListBlock).items];
                const idx = its.findIndex(it => it.id === item.id);
                if (idx !== -1) its[idx] = { ...item, html: v };
                return { ...(cur as ListBlock), items: its };
              })}
              className="text-sm text-gray-700 flex-1 leading-relaxed"
              placeholder="Describe this item…"
            />
            {/* 绝对定位删除按钮 - 在行右侧，hover 时显示 */}
            <button
              className="no-print absolute right-[-20px] top-[5px] opacity-0 group-hover/item:opacity-100 transition-opacity delay-0 group-hover/item:delay-[80ms] text-gray-300 hover:text-red-400"
              onClick={() => set(cur => ({
                ...(cur as ListBlock),
                items: (cur as ListBlock).items.filter(it => it.id !== item.id),
              }))}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
