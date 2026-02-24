import React, { useRef } from "react";
import { Trash2, Plus, UserCircle } from "lucide-react";
import { type Block, type PIBlock } from "../types";
import { useResume } from "../context";
import { CE } from "../components/CE";
import { BlockPanel } from "../components/BlockPanel";
import { useDebounceHover } from "../hooks";

// ── Panel content (private) ───────────────────────────────────────────────────
/** Block-specific options rendered inside the BlockPanel popover. */
function PIPanelContent({
  b, set,
}: {
  b: PIBlock;
  set: (fn: (cur: Block) => Block) => void;
}) {
  const { color } = useResume();
  const shape = b.avatarShape ?? "circle";

  return (
    <>
      {/* Add info line */}
      <button
        className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md w-full"
        onClick={() => set(cur => ({
          ...(cur as PIBlock),
          lines: [...(cur as PIBlock).lines, ""],
        }))}
      >
        <Plus size={11} /> Add info line
      </button>

      {/* Avatar shape */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-xs text-gray-400 shrink-0">Shape</span>
        <div className="flex gap-1">
          {(["circle", "square"] as const).map((s) => (
            <button
              key={s}
              onClick={() => set(cur => ({ ...(cur as PIBlock), avatarShape: s }))}
              className="text-xs px-2 py-0.5 rounded transition-colors"
              style={shape === s
                ? { background: color, color: "white" }
                : { border: "1px solid #e5e7eb", color: "#9ca3af" }
              }
            >
              {s === "circle" ? "○" : "□"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── View ──────────────────────────────────────────────────────────────────────
/** Personal information block — large name, info lines, and avatar. */
export function PIView({
  b, set, onUp, onDown, onDel,
}: {
  b: PIBlock;
  set: (fn: (cur: Block) => Block) => void;
  onUp: () => void;
  onDown: () => void;
  onDel: () => void;
}) {
  const { color } = useResume();
  const fileRef = useRef<HTMLInputElement>(null);
  const { hovered, onMouseEnter, onMouseLeave } = useDebounceHover();

  const upd = (patch: Partial<PIBlock>) => set(cur => ({ ...(cur as PIBlock), ...patch }));
  const shape = b.avatarShape ?? "circle";

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => upd({ avatar: ev.target!.result as string });
    r.readAsDataURL(f);
  };

  return (
    // -ml-8 pl-8: extends the hover zone 32 px to the left so moving from
    // block content to the gutter trigger never leaves the hover zone.
    <div
      className="group relative -ml-8 pl-8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <BlockPanel onUp={onUp} onDown={onDown} onDel={onDel} visible={hovered}>
        <PIPanelContent b={b} set={set} />
      </BlockPanel>

      {/* Content row + coloured bottom border */}
      <div
        className="flex items-start justify-between gap-6 py-4 mb-1"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        {/* Name + info lines */}
        <div className="flex-1 min-w-0">
          <CE
            html={b.name}
            onCommit={(v) => upd({ name: v })}
            className="text-[2rem] font-bold tracking-tight text-gray-900 leading-tight block"
            placeholder="Full Name"
          />

          <div className="mt-2 space-y-1">
            {b.lines.map((ln, i) => (
              <div key={i} className="group/ln flex items-center gap-2">
                <CE
                  html={ln}
                  onCommit={(v) => set(cur => {
                    const ls = [...(cur as PIBlock).lines];
                    ls[i] = v;
                    return { ...(cur as PIBlock), lines: ls };
                  })}
                  className="text-sm text-gray-500 flex-1 leading-relaxed"
                  placeholder="Info / Details…"
                />
                {/* Per-line delete — absolute so it takes no layout space */}
                <button
                  className="no-print opacity-0 group-hover/ln:opacity-100 text-gray-300 hover:text-red-400 transition-opacity shrink-0"
                  onClick={() => set(cur => ({
                    ...(cur as PIBlock),
                    lines: (cur as PIBlock).lines.filter((_, j) => j !== i),
                  }))}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="shrink-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className={`relative w-[100px] h-[100px] overflow-hidden ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}>
            {b.avatar
              ? <img src={b.avatar} className="w-full h-full object-cover" alt="avatar" />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}10` }}>
                  <UserCircle className="w-10 h-10" style={{ color: `${color}70` }} />
                </div>
            }
            <div
              className="no-print absolute inset-0 bg-black/0 hover:bg-black/10 cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
              title={b.avatar ? "Change avatar" : "Upload avatar"}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
