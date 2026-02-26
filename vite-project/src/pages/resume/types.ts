import { badgeVariants } from "@/components/ui/badge";

// ── Block types ──────────────────────────────────────────────────────────
export type PIBlock    = { id: string; type: "pi";    name: string; lines: string[]; avatar: string; avatarShape: "circle" | "square" };
export type TitleBlock = { id: string; type: "title"; title: string; sub: string };
export type ListItem   = { id: string; html: string };
export type ListBlock  = { id: string; type: "list";  iconType: "bullet" | "number"; items: ListItem[] };
export type Block = PIBlock | TitleBlock | ListBlock;

// ── AI response types ────────────────────────────────────────────────────
// Flat, LLM-friendly JSON shape returned by Dify workflow.
// Kept minimal so the AI only needs to produce simple key-value pairs.
//
// Tags use inline marker syntax inside any string field:
//   {{text|variant}}  where variant is "default" | "secondary" | "outline"
//   e.g. "Proficient in {{React|default}} and {{TypeScript|secondary}}"
// The converter parses these markers into badge HTML at render time.

export type AITagVariant = "default" | "secondary" | "outline";
const AI_TAG_VARIANTS: AITagVariant[] = ["default", "secondary", "outline"];

/** Regex matching inline tag markers: {{text|variant}}  */
const TAG_RE = /\{\{(.+?)\|(\w+)\}\}/g;

/** Replaces {{text|variant}} markers with badge HTML spans. */
export const parseAITags = (text: string): string =>
  text.replace(TAG_RE, (_, tagText: string, variant: string) => {
    const v = AI_TAG_VARIANTS.includes(variant as AITagVariant) ? variant as AITagVariant : "default";
    const escaped = tagText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const cls = badgeVariants({ variant: v }) + " leading-none";
    return `<span contenteditable="false" data-badge data-variant="${v}" class="${cls}" style="vertical-align:middle;line-height:1">${escaped}</span>`;
  });

export type AISection = {
  title: string;
  sub?: string;
  items: string[];
};

export type AIResumeData = {
  name: string;
  lines: string[];
  avatar?: string;
  sections: AISection[];
};

// ── Factories ─────────────────────────────────────────────────────────────
export const uid = () => crypto.randomUUID();

export const mkPI = (): PIBlock => ({
  id: uid(), type: "pi", name: "Jane Doe",
  lines: ["Software Engineer / Google / San Francisco", "jane@example.com / +1 415 000 0000"],
  avatar: "", avatarShape: "circle",
});
export const mkTitle = (t = "Section"): TitleBlock => ({ id: uid(), type: "title", title: t, sub: "" });
export const mkList  = (): ListBlock  => ({ id: uid(), type: "list", iconType: "bullet", items: [{ id: uid(), html: "Add an item…" }] });

export const DEFAULTS: Block[] = [
  { ...mkPI() },
  mkTitle("Work Experience"),
  { id: uid(), type: "list", iconType: "bullet", items: [
    { id: uid(), html: "Built microservices handling 10M+ daily requests" },
    { id: uid(), html: "Led a cross-functional team to ship a product in 6 weeks" },
  ]},
  mkTitle("Education"),
  { id: uid(), type: "list", iconType: "bullet", items: [{ id: uid(), html: "B.S. Computer Science — MIT, 2020" }] },
  mkTitle("Skills"),
  { id: uid(), type: "list", iconType: "bullet", items: [
    { id: uid(), html: "TypeScript · React · Node.js · Python" },
    { id: uid(), html: "AWS · Docker · Kubernetes" },
  ]},
];

/** Converts flat AI JSON into internal Block[] array. Parses {{tag|variant}} markers. */
export const convertAIResponse = (data: AIResumeData): Block[] => {
  const pi: PIBlock = {
    id: uid(), type: "pi",
    name: parseAITags(data.name),
    lines: data.lines.map(parseAITags),
    avatar: data.avatar ?? "",
    avatarShape: "circle",
  };

  const sectionBlocks = data.sections.flatMap<Block>((s) => [
    { id: uid(), type: "title", title: parseAITags(s.title), sub: parseAITags(s.sub ?? "") },
    { id: uid(), type: "list", iconType: "bullet", items: s.items.map((t) => ({ id: uid(), html: parseAITags(t) })) },
  ]);

  return [pi, ...sectionBlocks];
};

/** Demo AI response for testing the AI → resume render pipeline (includes tag markers). */
export const DEMO_AI_RESPONSE: AIResumeData = {
  name: "Alex Chen",
  lines: [
    "Senior Full-Stack Engineer / {{Meta|default}} / New York",
    "alex.chen@email.com / +1 212 555 0199 / linkedin.com/in/alexchen",
  ],
  sections: [
    {
      title: "Summary",
      items: [
        "Full-stack engineer with 7+ years building high-traffic web applications, specializing in {{React|default}}, {{TypeScript|secondary}}, and distributed systems.",
      ],
    },
    {
      title: "Work Experience",
      sub: "2018 – Present",
      items: [
        "Led the redesign of Meta's internal analytics dashboard using {{React|default}} and {{GraphQL|secondary}}, reducing page load by 40%",
        "Architected a real-time notification system on {{AWS|outline}} serving 50M+ daily active users",
        "Mentored 5 junior engineers and established team code-review standards",
      ],
    },
    {
      title: "Education",
      items: [
        "M.S. Computer Science — Stanford University, 2018",
        "B.S. Computer Science — UC Berkeley, 2016",
      ],
    },
    {
      title: "Skills",
      items: [
        "{{TypeScript|default}} {{React|default}} {{Next.js|default}} {{Node.js|default}} {{Python|secondary}} {{GraphQL|secondary}}",
        "{{AWS|outline}} {{GCP|outline}} {{Docker|outline}} {{Kubernetes|outline}} {{PostgreSQL|secondary}} {{Redis|secondary}}",
      ],
    },
  ],
};

// ── Color utils ───────────────────────────────────────────────────────────
export const lighten = (hex: string, t = 0.85): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
};
