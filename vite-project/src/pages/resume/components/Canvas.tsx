import React from "react";
import { Loader2 } from "lucide-react";
import { type Block } from "../types";
import { useResume, FONT_OPTIONS } from "../context";
import { PIView    } from "../blocks/PIBlock";
import { TitleView } from "../blocks/TitleBlock";
import { ListView  } from "../blocks/ListBlock";

/** The scrollable A4-sized resume preview. Renders all blocks in order. */
export function Canvas() {
  const { blocks, setBlocks, color, lightColor, paddingH, paddingV, font, isLoading } = useResume();

  /** Applies patcher fn to the block with the given id. */
  const update = (id: string, fn: (cur: Block) => Block) =>
    setBlocks(bs => bs.map(b => b.id === id ? fn(b) : b));

  /** Swaps block at index i with its neighbour at i + dir. */
  const move = (i: number, dir: -1 | 1) =>
    setBlocks(bs => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const a = [...bs];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  /** Removes a block by id. */
  const remove = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id));

  /** Renders the correct view component for a given block. */
  const renderBlock = (b: Block, i: number) => {
    const set   = (fn: (cur: Block) => Block) => update(b.id, fn);
    const onUp   = () => move(i, -1);
    const onDown = () => move(i,  1);
    const onDel  = () => remove(b.id);

    switch (b.type) {
      case "pi":    return <PIView    key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
      case "title": return <TitleView key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
      case "list":  return <ListView  key={b.id} b={b} set={set} onUp={onUp} onDown={onDown} onDel={onDel} />;
    }
  };

  return (
    <div id="resume-wrap" className="flex-1 bg-gray-100 py-10 flex justify-center overflow-auto">
      <div className="relative">
        {/* Loading overlay — covers the canvas while AI is processing. */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color }} />
              <span className="text-sm font-medium text-gray-500">AI is writing your resume…</span>
            </div>
          </div>
        )}

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
