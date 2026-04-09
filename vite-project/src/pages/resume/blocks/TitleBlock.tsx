import { type Block, type TitleBlock } from "../types";
import { useResume } from "../useResume";
import { CE } from "../components/editor/CE";
import { BlockPanel } from "../components/editor/BlockPanel";
import { useDebounceHover } from "../hooks";

/**
 * TitleView - 标题区块视图
 *
 * 显示带可选副标题的分区标题，下方有主题色分隔线
 *
 * @param b - 区块数据
 * @param set - 区块更新函数
 * @param onUp/onDown/onDel - 区块操作（上移/下移/删除）
 */
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
      {/* 标题区块没有特定操作 - 面板只显示上下移动和删除 */}
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered} />

      {/* 标题 + 副标题 */}
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
      {/* 分隔线 */}
      <div className="mt-1.5 border-t" style={{ borderColor: color }} />
    </div>
  );
}
