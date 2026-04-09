import { useState } from "react";
import { FileDown, FileJson, Plus, Sparkles, Undo2 } from "lucide-react";
import { useResume } from "../../useResume";
import type { FontId } from "../constants";
import { DEMO_AI_RESPONSE } from "../../types";
import { BLOCK_TYPES, FONT_OPTIONS } from "../constants";
import { ImportJsonPanel } from "../controls/ImportJsonPanel";
import { ColorPicker } from "../controls/ColorPicker";
import { PaddingSlider } from "../controls/PaddingSlider";
import { FontSelector } from "../controls/FontSelector";

/**
 * Sidebar - 左侧边栏组件
 *
 * 包含功能：
 * - 添加区块按钮组（Personal Info、Section Title、List、Info Line）
 * - 外观设置（主色调、字体、内边距）
 * - AI 操作（导入 JSON、生成 Demo、恢复上一版）
 * - 导出 PDF
 *
 * 布局：固定高度（h-full），内部滚动，区块内容在中央不随页面滚动
 */
export function Sidebar() {
  // ── 状态 ─────────────────────────────────────────────────────────────────
  const { color, setColor, paddingH, setPaddingH, paddingV, setPaddingV, font, setFont, addBlock, isLoading, loadAIResponse, importFromJson, restoreBlocks, canRestore } = useResume();
  const [importPanelOpen, setImportPanelOpen] = useState(false);

  // ── 处理 Demo AI 按钮点击 ────────────────────────────────────────────────
  const handleDemoAI = () => { if (!isLoading) loadAIResponse(DEMO_AI_RESPONSE); };

  return (
    <>
    {/* 侧边栏主体 */}
    <aside className="resume-sidebar no-print w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto">

      {/* 标题区 */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
        <h1 className="font-bold text-gray-800 text-sm tracking-tight">Resume Builder</h1>
      </div>

      {/* 功能区域 */}
      <div className="flex-1 flex flex-col gap-6 p-4">

        {/* ── 添加区块 ── */}
        <section>
          <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Add Block</h2>
          <div className="flex flex-col gap-1">
            {BLOCK_TYPES.map(({ type, label, desc }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center"
                  style={{ background: `${color}15`, color }}
                >
                  <Plus size={12} />
                </span>
                <div>
                  <div className="text-sm text-gray-700 font-medium leading-none mb-0.5">{label}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 外观设置 ── */}
        <section>
          <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Appearance</h2>

          {/* 颜色选择器 */}
          <ColorPicker color={color} onChange={setColor} />

          {/* 字体选择器 */}
          <FontSelector
            value={font}
            onChange={(id) => setFont(id as FontId)}
            fonts={[...FONT_OPTIONS]}
          />

          {/* 内边距滑块 */}
          <div className="space-y-3 mt-4">
            <PaddingSlider label="Padding H" value={paddingH} onChange={setPaddingH} color={color} />
            <PaddingSlider label="Padding V" value={paddingV} onChange={setPaddingV} color={color} />
          </div>
        </section>

      </div>

      {/* ── AI 操作区 ── */}
      <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
        <button
          onClick={() => setImportPanelOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Import from JSON"
          tabIndex={0}
        >
          <FileJson size={14} /> Import from JSON
        </button>
        <button
          onClick={handleDemoAI}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: color }}
          aria-label="Demo AI resume"
          tabIndex={0}
        >
          <Sparkles size={14} /> {isLoading ? "Generating…" : "Demo AI"}
        </button>

        {canRestore && (
          <button
            onClick={restoreBlocks}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Restore previous resume"
            tabIndex={0}
          >
            <Undo2 size={14} /> Restore Previous
          </button>
        )}
      </div>

      {/* ── 导出按钮 ── */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85"
          style={{ background: color }}
        >
          <FileDown size={14} /> Export PDF
        </button>
      </div>

    </aside>

    {/* 导入面板 */}
    {importPanelOpen && (
      <ImportJsonPanel
        onConfirm={importFromJson}
        onClose={() => setImportPanelOpen(false)}
      />
    )}
    </>
  );
}