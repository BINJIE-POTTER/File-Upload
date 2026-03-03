import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useResume } from "../context";
import { AIChatPanel } from "./AIChatPanel";

/**
 * Floating AI button fixed at right-bottom. Expands to a resizable chat panel.
 */
export function FloatingAIButton() {
  const { color } = useResume();
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => setExpanded((p) => !p);

  return (
    <>
      {!expanded && (
        <button
          type="button"
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl no-print"
          style={{ background: color }}
          aria-label="Open AI assistant"
          aria-expanded={false}
        >
          <Sparkles size={24} className="text-white" aria-hidden />
        </button>
      )}

      {expanded && <AIChatPanel onClose={() => setExpanded(false)} />}
    </>
  );
}
