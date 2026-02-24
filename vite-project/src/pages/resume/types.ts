// ── Block types ──────────────────────────────────────────────────────────
export type PIBlock    = { id: string; type: "pi";    name: string; lines: string[]; avatar: string; avatarShape: "circle" | "square" };
export type TitleBlock = { id: string; type: "title"; title: string; sub: string };
export type ListItem   = { id: string; html: string };
export type ListBlock  = { id: string; type: "list";  iconType: "bullet" | "number"; items: ListItem[] };
export type Block = PIBlock | TitleBlock | ListBlock;

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

// ── Color utils ───────────────────────────────────────────────────────────
export const lighten = (hex: string, t = 0.85): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
};
