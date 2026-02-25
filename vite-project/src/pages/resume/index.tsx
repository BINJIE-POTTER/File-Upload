import { ResumeProvider, useResume } from "./context";
import { Sidebar } from "./components/Sidebar";
import { Canvas  } from "./components/Canvas";

/**
 * Injects global CSS that reacts to colour / padding state changes.
 * Covers: CE placeholders and @media print rules.
 */
function GlobalStyles() {
  const { color, lightColor, paddingH, paddingV } = useResume();

  return (
    <style>{`
      /* ── Badge insert cursor (fake caret when panel open) ─────────────── */
      [data-badge-cursor-marker] {
        animation: ce-caret-blink 1s step-end infinite;
      }
      @keyframes ce-caret-blink {
        50% { opacity: 0; }
      }

      /* ── CE placeholder text ─────────────────────────────────────────── */
      [data-ph]:empty::before {
        content: attr(data-ph);
        color: #d1d5db;
        pointer-events: none;
        font-weight: normal;
        font-style: normal;
        text-transform: none;
        letter-spacing: normal;
      }

      /* ── Print ───────────────────────────────────────────────────────── */
      @media print {
        @page { size: A4; margin: 0; }

        /* Hide all editor chrome */
        .no-print,
        .resume-sidebar,
        nav[data-slot="navigation-menu"] { display: none !important; }

        body, html { background: white !important; }

        /* Strip the grey wrapper so the canvas fills the page */
        #resume-wrap {
          background: white !important;
          padding: 0 !important;
          display: block !important;
          min-height: 0 !important;
        }

        /* Canvas = the printed page */
        #resume-canvas {
          box-shadow: none !important;
          border-radius: 0 !important;
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: ${paddingV}mm ${paddingH}mm !important;
          --resume-color: ${color};
          --resume-light: ${lightColor};
        }

        /* Force background colours to print (browser default strips them) */
        [data-tag] {
          background: ${lightColor} !important;
          color: ${color} !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Badge: retain colours when printing */
        [data-badge] {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        [data-badge-selected] {
          box-shadow: none !important;
        }
      }

      /* Badge: cursor + selection (no layout change) */
      #resume-canvas [data-badge] {
        cursor: pointer;
      }
      #resume-canvas [data-badge][data-badge-selected] {
        box-shadow: 0 0 0 2px var(--resume-color);
      }

      /* Badge: use resume primary color when inside canvas */
      #resume-canvas [data-badge][data-variant="default"] {
        background: var(--resume-color) !important;
        color: white !important;
      }
      #resume-canvas [data-badge][data-variant="secondary"] {
        background: var(--resume-light) !important;
        color: var(--resume-color) !important;
      }
      #resume-canvas [data-badge][data-variant="outline"] {
        border-color: var(--resume-color) !important;
        color: var(--resume-color) !important;
      }
      #resume-canvas [data-badge][data-variant="ghost"],
      #resume-canvas [data-badge][data-variant="link"] {
        color: var(--resume-color) !important;
      }
    `}</style>
  );
}

/** Two-panel layout: fixed sidebar on the left, scrollable canvas on the right. */
function ResumeApp() {
  return (
    <>
      <GlobalStyles />
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <Canvas />
      </div>
    </>
  );
}

export default function ResumePage() {
  return (
    <ResumeProvider>
      <ResumeApp />
    </ResumeProvider>
  );
}
