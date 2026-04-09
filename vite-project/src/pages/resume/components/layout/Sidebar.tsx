import { useState } from "react";
import { FileDown, FileJson, Plus, Sparkles, Undo2 } from "lucide-react";
import { useResume, FONT_OPTIONS, type FontId } from "../../context";
import { DEMO_AI_RESPONSE } from "../../types";
import { BLOCK_TYPES } from "../constants";
import { ImportJsonPanel } from "../controls/ImportJsonPanel";
import { ColorPicker } from "../controls/ColorPicker";
import { PaddingSlider } from "../controls/PaddingSlider";
import { FontSelector } from "../controls/FontSelector";

/**
 * Left sidebar — block palette, colour picker, padding slider, and PDF export.
 * Fixed height (h-full) so it never scrolls with the canvas; overflows internally.
 */
export function Sidebar() {
  const { color, setColor, paddingH, setPaddingH, paddingV, setPaddingV, font, setFont, addBlock, isLoading, loadAIResponse, importFromJson, restoreBlocks, canRestore } = useResume();
  const [importPanelOpen, setImportPanelOpen] = useState(false);

  const handleDemoAI = () => { if (!isLoading) loadAIResponse(DEMO_AI_RESPONSE); };

  return (
    <>
    <aside className="resume-sidebar no-print w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
        <h1 className="font-bold text-gray-800 text-sm tracking-tight">Resume Builder</h1>
      </div>

      <div className="flex-1 flex flex-col gap-6 p-4">

        {/* ── Add Block ── */}
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

        {/* ── Appearance ── */}
        <section>
          <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Appearance</h2>

          <ColorPicker color={color} onChange={setColor} />

          <FontSelector
            value={font}
            onChange={(id) => setFont(id as FontId)}
            fonts={[...FONT_OPTIONS]}
          />

          <div className="space-y-3 mt-4">
            <PaddingSlider label="Padding H" value={paddingH} onChange={setPaddingH} color={color} />
            <PaddingSlider label="Padding V" value={paddingV} onChange={setPaddingV} color={color} />
          </div>
        </section>

      </div>

      {/* ── AI Actions ── */}
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

      {/* ── Export ── */}
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

    {importPanelOpen && (
      <ImportJsonPanel
        onConfirm={importFromJson}
        onClose={() => setImportPanelOpen(false)}
      />
    )}
    </>
  );
}