import { type Block, type TitleBlock } from "../types";
import { useResume } from "../context";
import { CE } from "../components/CE";
import { BlockPanel } from "../components/BlockPanel";
import { useDebounceHover } from "../hooks";

/** Section title with an optional subtitle and a coloured divider line. */
export function TitleView({
  b, set, onUp, onDown, onDel,
}: {
  b: TitleBlock;
  set: (fn: (cur: Block) => Block) => void;
  onUp: () => void;
  onDown: () => void;
  onDel: () => void;
}) {
  const { color } = useResume();
  const { hovered, onMouseEnter, onMouseLeave } = useDebounceHover();

  return (
    <div
      className="group relative pt-2 pb-1 -ml-8 pl-8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* No block-specific options for a title block — panel only shows up/down/delete */}
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered} />

      <div className="flex items-baseline gap-2 flex-wrap">
        <CE
          html={b.title}
          onCommit={(v) => set(cur => ({ ...(cur as TitleBlock), title: v }))}
          className="text-sm font-bold uppercase tracking-widest text-gray-700"
          placeholder="Section Title"
        />
        <CE
          html={b.sub}
          onCommit={(v) => set(cur => ({ ...(cur as TitleBlock), sub: v }))}
          className="text-sm text-gray-400"
          placeholder="Optional subtitle"
        />
      </div>
      <div className="mt-1.5 border-t" style={{ borderColor: color }} />
    </div>
  );
}
