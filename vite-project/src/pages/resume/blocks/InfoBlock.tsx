import { type Block, type InfoBlock } from "../types";
import { CE } from "../components/editor/CE";
import { BlockPanel } from "../components/editor/BlockPanel";
import { useDebounceHover } from "../hooks";
import { useResume } from "../useResume";

/**
 * InfoView - 信息行区块视图
 *
 * 单行区块，左侧和右侧分别对齐：
 * - 左侧：起始对齐
 * - 右侧：结束对齐（用于日期、位置、状态等次要信息）
 *
 * @param b - 区块数据
 * @param set - 区块更新函数
 * @param onUp/onDown/onDel - 区块操作（上移/下移/删除）
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
  const { extraLightColor } = useResume();
  const { hovered, onMouseEnter, onMouseLeave } = useDebounceHover();

  return (
    <div
      className="group relative pt-1 -ml-8 pl-8 flex items-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered} />

      <div 
        className="flex items-baseline justify-between gap-4 w-full min-w-0 rounded-md px-2 py-1.5"
        style={{ backgroundColor: extraLightColor }}
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
