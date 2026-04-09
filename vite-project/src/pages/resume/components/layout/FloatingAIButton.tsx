import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useResume } from "../../useResume";
import { AIChatPanel } from "../chat/AIChatPanel";

/**
 * FloatingAIButton - 悬浮 AI 按钮
 *
 * 固定在右下角的浮动按钮，点击后展开为可调整大小的聊天面板
 *
 * 状态：
 * - collapsed（默认）：显示闪烁的 AI 图标按钮
 * - expanded：显示 AIChatPanel 面板
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
