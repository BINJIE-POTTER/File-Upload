import { type Block, type InfoBlock } from "../types";
import { CE } from "../components/CE";
import { BlockPanel } from "../components/BlockPanel";
import { useDebounceHover } from "../hooks";
import { useResume } from "../context";

/**
 * Single-line block with two sections:
 * - Left: aligns at start
 * - Right: aligns at end
 * For secondary info (e.g. dates, location, status).
 */
export function InfoView({
  b,
  set,
  onUp,
  onDown,
  onDel,
}: {
  b: InfoBlock;
  set: (fn: (cur: Block) => Block) => void;
  onUp: () => void;
  onDown: () => void;
  onDel: () => void;
}) {
  const { lightColor } = useResume();
  const { hovered, onMouseEnter, onMouseLeave } = useDebounceHover();

  return (
    <div
      className="group relative pt-1 -ml-8 pl-8 flex items-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered} />

      <div 
        className="flex items-baseline justify-between gap-4 w-full min-w-0 rounded px-2"
        style={{ backgroundColor: lightColor }}
      >
        <div className="flex-1 min-w-0 text-left">
          <CE
            html={b.left}
            onCommit={(v) => set((cur) => ({ ...(cur as InfoBlock), left: v }))}
            className="text-sm text-gray-600"
            placeholder="Left-aligned info"
          />
        </div>
        <div className="shrink-0 text-right">
          <CE
            html={b.right}
            onCommit={(v) => set((cur) => ({ ...(cur as InfoBlock), right: v }))}
            className="text-sm text-gray-500"
            placeholder="Right-aligned"
          />
        </div>
      </div>
    </div>
  );
}
