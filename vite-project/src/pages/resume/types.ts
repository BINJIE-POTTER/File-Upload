import { badgeVariants } from "@/components/ui/badge";

// ── Block types ──────────────────────────────────────────────────────────
export type PIBlock    = { id: string; type: "pi";    name: string; lines: string[]; avatar: string; avatarShape: "circle" | "square" };
export type TitleBlock = { id: string; type: "title"; title: string; sub: string };
export type ListItem   = { id: string; html: string };
export type ListBlock  = { id: string; type: "list";  iconType: "bullet" | "number"; items: ListItem[] };
/**
 * InfoBlock - 信息行区块（单行左右对齐）
 * left: 左侧文本（起始对齐）
 * right: 右侧文本（结束对齐，用于日期、位置、状态等）
 */
export type InfoBlock  = { id: string; type: "info";  left: string; right: string };
export type Block = PIBlock | TitleBlock | ListBlock | InfoBlock;

// ── AI 响应类型 ─────────────────────────────────────────────────────────────

/**
 * AI 标签徽章变体
 */
export type AITagVariant = "default" | "secondary" | "outline";
const AI_TAG_VARIANTS: AITagVariant[] = ["default", "secondary", "outline"];

/** 解析 {{text|format}} 标记的正则表达式 */
const AI_MARKER_RE = /\{\{(.+?)\|([^}]+)\}\}/g;

/**
 * HTML 转义
 */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * parseAITags - 解析 AI 文本中的 {{text|format}} 标记
 *
 * 支持的格式：
 * - default/secondary/outline → 徽章
 * - bold → 加粗
 * - italic → 斜体
 * - #hex → 颜色（如 #ef4444）
 * - 组合：逗号分隔（如 #ef4444,bold）
 */
export const parseAITags = (text: string): string =>
  text.replace(AI_MARKER_RE, (_, body: string, format: string) => {
    const fmt = format.trim().toLowerCase();
    const parts = fmt.split(",").map((p) => p.trim());
    const variant = parts.find((p) => AI_TAG_VARIANTS.includes(p as AITagVariant)) as AITagVariant | undefined;
    const bold = parts.includes("bold");
    const italic = parts.includes("italic");
    const color = parts.find((p) => p.startsWith("#") && /^#[0-9a-f]{6}$/i.test(p));
    const escaped = escapeHtml(body);

    if (variant) {
      const cls = badgeVariants({ variant }) + " leading-none";
      return `<span contenteditable="false" data-badge data-variant="${variant}" class="${cls}" style="vertical-align:middle;line-height:1">${escaped}</span>`;
    }
    let inner = escaped;
    if (italic) inner = `<em>${inner}</em>`;
    if (bold) inner = `<strong>${inner}</strong>`;
    if (color) inner = `<span style="color:${color}">${inner}</span>`;
    return inner;
  });

/**
 * AI 区块
 */
export type AISection = {
  title: string;
  sub?: string;
  items: string[];
};

/**
 * AI 简历数据格式（Dify 工作流返回的扁平化 JSON）
 *
 * 格式说明：
 * - name: 姓名
 * - lines: 联系信息数组
 * - avatar: 头像 URL（可选）
 * - sections: 区块数组
 */
export type AIResumeData = {
  name: string;
  lines: string[];
  avatar?: string;
  sections: AISection[];
};

/**
 * validateAIResumeData - 验证未知数据是否为 AIResumeData
 * 用于 ImportJsonPanel 和 AI 聊天中的数据验证
 */
export const validateAIResumeData = (data: unknown): data is AIResumeData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.name !== "string") return false;
  if (!Array.isArray(d.lines) || !d.lines.every((l) => typeof l === "string")) return false;
  if (!Array.isArray(d.sections)) return false;
  for (const s of d.sections as unknown[]) {
    if (!s || typeof s !== "object") return false;
    const sec = s as Record<string, unknown>;
    if (typeof sec.title !== "string") return false;
    if (sec.sub !== undefined && typeof sec.sub !== "string") return false;
    if (!Array.isArray(sec.items) || !sec.items.every((i) => typeof i === "string")) return false;
  }
  return true;
};

// ── 工厂函数 ────────────────────────────────────────────────────────────────

/**
 * 生成唯一标识符
 */
export const uid = () => crypto.randomUUID();

/**
 * 创建个人信息区块
 */
export const mkPI = (): PIBlock => ({
  id: uid(), type: "pi", name: "Jane Doe",
  lines: ["Software Engineer / Google / San Francisco", "jane@example.com / +1 415 000 0000"],
  avatar: "", avatarShape: "circle",
});

/**
 * 创建标题区块
 */
export const mkTitle = (t = "Section"): TitleBlock => ({ id: uid(), type: "title", title: t, sub: "" });

/**
 * 创建列表区块
 */
export const mkList  = (): ListBlock  => ({ id: uid(), type: "list", iconType: "bullet", items: [{ id: uid(), html: "Add an item…" }] });

/**
 * 创建信息行区块
 */
export const mkInfo  = (): InfoBlock  => ({ id: uid(), type: "info", left: "Secondary info", right: "Right-aligned" });

/**
 * 默认区块列表（初始简历内容）
 */
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

/**
 * convertAIResponse - 将 AI JSON 转换为内部 Block[] 数组
 * 解析 {{tag|variant}} 标记
 */
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

/**
 * DEMO_AI_RESPONSE - 测试用 AI 响应数据
 * 包含各种徽章、加粗、斜体、颜色格式示例
 */
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
        "{{7+ years|bold}} building web apps. Specializing in {{React|default}}, {{TypeScript|secondary}}, {{distributed systems|italic}}.",
      ],
    },
    {
      title: "Work Experience",
      sub: "2018 – Present",
      items: [
        "{{Led|bold}} redesign of analytics dashboard using {{React|default}} and {{GraphQL|secondary}}, {{40% faster load|#22c55e,bold}}",
        "Architected real-time system on {{AWS|outline}} serving {{50M+ users|#3b82f6}}",
        "Mentored 5 engineers, established {{code-review standards|italic}}",
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

// ── 颜色工具函数 ──────────────────────────────────────────────────────────

/**
 * lighten -  HEX 颜色转换为 RGB 并按比例混合白色
 *
 * @param hex - HEX 颜色值（如 #3b82f6）
 * @param t - 混合比例（0-1），值越大越浅，默认 0.85
 * @returns RGB 格式的颜色字符串
 */
export const lighten = (hex: string, t = 0.85): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
};
