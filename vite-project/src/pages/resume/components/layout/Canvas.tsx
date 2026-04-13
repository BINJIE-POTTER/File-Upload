import React from "react";
import { Loader2 } from "lucide-react";
import { type Block } from "../../types";
import { useResume } from "../../useResume";
import { FONT_OPTIONS } from "../constants";
import { PIView    } from "../../blocks/PIBlock";
import { TitleView } from "../../blocks/TitleBlock";
import { ListView  } from "../../blocks/ListBlock";
import { InfoView  } from "../../blocks/InfoBlock";

/**
 * Canvas - 简历画布组件
 *
 * 可滚动的 A4 尺寸简历预览区，渲染所有区块
 *
 * 功能：
 * - 显示/隐藏加载遮罩（AI 生成时）
 * - 区块的增删改操作（通过 useResume 获取状态和方法）
 * - 区块排序（上移/下移）
 */
export function Canvas() {
  const { blocks, color, lightColor, paddingH, paddingV, font, isLoading, updateBlock, moveBlock, removeBlock } = useResume();

  // ── 渲染区块 ─────────────────────────────────────────────────────────────
  /**
   * 根据区块类型渲染对应的视图组件
   */
  const renderBlock = (b: Block, i: number) => {
    const set   = (fn: (cur: Block) => Block) => updateBlock(b.id, fn);
    const onUp   = () => moveBlock(i, -1);
    const onDown = () => moveBlock(i,  1);
    const onDel  = () => removeBlock(b.id);

    switch (b.type) {
      case "pi":    return <PIView    key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
      case "title": return <TitleView key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
      case "list":  return <ListView  key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
      case "info":  return <InfoView  key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
    }
  };

  return (
    <div id="resume-wrap" className="flex-1 bg-gray-100 py-10 flex justify-center overflow-auto">
      <div className="relative">
        {/* AI 处理中的加载遮罩 */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color }} />
              <span className="text-sm font-medium text-gray-500">AI is writing your resume…</span>
            </div>
          </div>
        )}

        {/* 简历画布 */}
        <div
          id="resume-canvas"
          className="bg-white shadow-xl rounded-sm"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: `${paddingV}mm ${paddingH}mm`,
            "--resume-color": color,
            "--resume-light": lightColor,
            fontFamily: FONT_OPTIONS.find((f) => f.id === font)?.fontFamily,
          } as React.CSSProperties}
        >
          {blocks.map((b, i) => renderBlock(b, i))}
        </div>
      </div>
    </div>
  );
}
