import { FileDown, Plus, Sparkles, Undo2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useResume, FONT_OPTIONS } from "../context";
import { type Block, DEMO_AI_RESPONSE } from "../types";

const COLOR_PRESETS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

const BLOCK_TYPES: { type: Block["type"]; label: string; desc: string }[] = [
  { type: "pi",    label: "Personal Info",  desc: "Name, contacts & avatar"  },
  { type: "title", label: "Section Title",  desc: "Heading with divider"     },
  { type: "list",  label: "List",           desc: "Bullet or numbered items" },
];

/**
 * Left sidebar — block palette, colour picker, padding slider, and PDF export.
 * Fixed height (h-full) so it never scrolls with the canvas; overflows internally.
 */
export function Sidebar() {
  const { color, setColor, paddingH, setPaddingH, paddingV, setPaddingV, font, setFont, addBlock, isLoading, loadAIResponse, restoreBlocks, canRestore } = useResume();

  /** Fires the demo AI flow with sample data. */
  const handleDemoAI = () => { if (!isLoading) loadAIResponse(DEMO_AI_RESPONSE); };

  return (
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

          {/* Primary colour swatches + custom picker */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Primary Color</label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setColor(p)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0"
                  style={{
                    background: p,
                    outline: color === p ? `2.5px solid ${p}` : "2.5px solid transparent",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label
                className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer shrink-0"
                style={{ background: color, outline: "2px solid #e5e7eb" }}
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
              <span className="text-xs font-mono text-gray-400">{color}</span>
            </div>
          </div>

          {/* Font style */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-2">Font</label>
            <div className="flex gap-1">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    font === f.id ? "bg-gray-100 font-medium text-gray-800" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={font === f.id ? { fontFamily: f.fontFamily } : undefined}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page padding */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-2">
                Padding H <span className="font-mono text-gray-400">{paddingH}mm</span>
              </label>
              <div style={{ "--primary": color, "--ring": color } as React.CSSProperties}>
                <Slider
                  min={8}
                  max={25}
                  step={1}
                  value={[paddingH]}
                  onValueChange={([v]) => setPaddingH(v)}
                  className="[&_[data-slot=slider-range]]:bg-[var(--primary)] [&_[data-slot=slider-thumb]]:border-[var(--primary)]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-2">
                Padding V <span className="font-mono text-gray-400">{paddingV}mm</span>
              </label>
              <div style={{ "--primary": color, "--ring": color } as React.CSSProperties}>
                <Slider
                  min={8}
                  max={25}
                  step={1}
                  value={[paddingV]}
                  onValueChange={([v]) => setPaddingV(v)}
                  className="[&_[data-slot=slider-range]]:bg-[var(--primary)] [&_[data-slot=slider-thumb]]:border-[var(--primary)]"
                />
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── AI Actions ── */}
      <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
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
  );
}
