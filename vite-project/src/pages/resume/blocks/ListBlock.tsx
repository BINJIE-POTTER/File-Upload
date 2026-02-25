import React from "react";
import { Trash2, Plus } from "lucide-react";
import { uid, type Block, type ListBlock } from "../types";
import { useResume } from "../context";
import { CE } from "../components/CE";
import { BlockPanel } from "../components/BlockPanel";
import { useDebounceHover } from "../hooks";

// ── Sub-components ────────────────────────────────────────────────────────────

/** Filled primary-colour circle used as a bullet point. */
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

/** Numbered circle with the primary colour background — force-printed via print-color-adjust. */
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

// ── Panel content (private) ───────────────────────────────────────────────────
/** Block-specific options rendered inside the BlockPanel popover. */
function ListPanelContent({
  b, set,
}: {
  b: ListBlock;
  set: (fn: (cur: Block) => Block) => void;
}) {
  const { color } = useResume();

  return (
    <>
      {/* Bullet / number toggle */}
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

      {/* Add item */}
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
/** Bullet or numbered list block. */
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

      <div className="space-y-1.5 pl-1">
        {b.items.map((item, i) => (
          // relative + pr-5: delete button is absolute so it takes no layout space
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
            {/* Absolute: sits at the right edge, takes no space in the flex row */}
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
