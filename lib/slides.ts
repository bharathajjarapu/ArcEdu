import type { Palette } from "@/types";

// One generated slide; its layout decides which fields are drawn.
export interface Slide {
  layout: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  columns?: { heading: string; bullets: string[] }[];
  stats?: { value: string; label: string }[];
  steps?: string[];
  rows?: string[][];
  quote?: string;
  author?: string;
  notes?: string;
}

// A text or shape placed in inches on a 10 x 5.625 slide, drawn the same on the web and in PowerPoint.
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  fill?: string;
  fade?: number;
  round?: boolean;
  pad?: number;
}

// Cover colors for the title and closing slides, paper and ink for the rest.
export const palettes: Record<Palette, { cover: string; paper: string; ink: string; dim: string; accent: string }> = {
  minimal: { cover: "18181B", paper: "FFFFFF", ink: "18181B", dim: "71717A", accent: "2563EB" },
  dark: { cover: "09090B", paper: "18181B", ink: "FAFAFA", dim: "A1A1AA", accent: "38BDF8" },
  colorful: { cover: "5B21B6", paper: "FFFFFF", ink: "1E1B4B", dim: "6B7280", accent: "DB2777" },
  ocean: { cover: "0C4A6E", paper: "FFFFFF", ink: "0F172A", dim: "64748B", accent: "0284C7" },
  forest: { cover: "14532D", paper: "FFFFFF", ink: "1C1917", dim: "6B7280", accent: "16A34A" },
  sunset: { cover: "7C2D12", paper: "FFFFFF", ink: "292524", dim: "78716C", accent: "EA580C" },
  purple: { cover: "3B0764", paper: "FFFFFF", ink: "1E1B4B", dim: "6B7280", accent: "9333EA" },
};

// Parses the complete JSON slide lines streamed so far.
export function parse(text: string): Slide[] {
  return text.split("\n").flatMap((line) => {
    try {
      const item = JSON.parse(line.trim().replace(/,$/, ""));
      return typeof item?.layout === "string" ? [item] : [];
    } catch {
      return [];
    }
  });
}

// Keeps an array from the model safe to map, capped at a count.
const list = <T>(items: T[] | undefined, max: number) => (Array.isArray(items) ? items : []).slice(0, max);

// Lays a slide out as boxes; the title and closing slides use the dark cover.
export function draw(slide: Slide, index: number, total: number, palette: Palette) {
  const theme = palettes[palette] ?? palettes.colorful;
  const dark = slide.layout === "title" || index === total - 1;
  const bg = dark ? theme.cover : theme.paper;
  const ink = dark ? "FFFFFF" : theme.ink;
  const dim = dark ? "D4D4D8" : theme.dim;
  const { accent, paper } = theme;
  const boxes: Box[] = [];
  const add = (...items: Box[]) => boxes.push(...items);

  if (slide.layout === "title") {
    add(
      { x: 0.7, y: 1.5, w: 0.8, h: 0.08, fill: accent },
      { x: 0.7, y: 1.75, w: 8.6, h: 1.5, text: slide.title, size: 40, bold: true, color: ink },
      { x: 0.7, y: 3.4, w: 8.6, h: 1, text: slide.subtitle, size: 18, color: dim },
    );
    return { bg, boxes };
  }

  if (slide.layout === "quote") {
    add(
      { x: 0.6, y: 0.3, w: 1.2, h: 1.6, text: "“", size: 96, bold: true, color: accent },
      { x: 1.2, y: 1.5, w: 7.8, h: 2.3, text: slide.quote, size: 28, color: ink, valign: "middle" },
      { x: 1.2, y: 4, w: 7.8, h: 0.5, text: slide.author && `— ${slide.author}`, size: 14, color: dim },
    );
    return { bg, boxes };
  }

  // Every other slide shares a numbered kicker and title.
  add(
    { x: 0.5, y: 0.4, w: 2, h: 0.3, text: String(index + 1).padStart(2, "0"), size: 12, bold: true, color: accent },
    { x: 0.5, y: 0.7, w: 9, h: 0.9, text: slide.title, size: 28, bold: true, color: ink },
  );

  if (slide.layout === "columns" || slide.layout === "stats") {
    const cards = slide.layout === "stats" ? list(slide.stats, 4) : list(slide.columns, 3);
    const w = (9 - 0.3 * (cards.length - 1)) / cards.length;
    cards.forEach((card, i) => {
      const x = 0.5 + i * (w + 0.3);
      if ("value" in card) {
        add(
          { x, y: 2, w, h: 2.4, fill: accent, fade: 90 },
          { x, y: 2, w, h: 0.06, fill: accent },
          { x: x + 0.3, y: 2.3, w: w - 0.6, h: 1, text: card.value, size: cards.length > 3 ? 36 : 44, bold: true, color: accent },
          { x: x + 0.3, y: 3.35, w: w - 0.6, h: 0.9, text: card.label, size: 14, color: ink },
        );
      } else {
        add(
          { x, y: 1.8, w, h: 3.1, fill: accent, fade: 90 },
          { x, y: 1.8, w, h: 0.06, fill: accent },
          { x: x + 0.25, y: 2.05, w: w - 0.5, h: 0.6, text: card.heading, size: 18, bold: true, color: ink },
          ...list(card.bullets, 3).map((line, n): Box => ({ x: x + 0.25, y: 2.7 + n * 0.7, w: w - 0.5, h: 0.7, text: `• ${line}`, size: 15, color: ink })),
        );
      }
    });
  } else if (slide.layout === "steps") {
    const steps = list(slide.steps, 5);
    const w = 9 / steps.length;
    add({ x: 0.5 + w / 2, y: 2.68, w: 9 - w, h: 0.04, fill: accent, fade: 50 });
    steps.forEach((step, i) => {
      const x = 0.5 + i * w;
      add(
        { x: x + w / 2 - 0.35, y: 2.35, w: 0.7, h: 0.7, round: true, fill: accent, text: String(i + 1), size: 20, bold: true, color: paper, align: "center", valign: "middle" },
        { x: x + 0.1, y: 3.25, w: w - 0.2, h: 1.3, text: step, size: 16, color: ink, align: "center" },
      );
    });
  } else if (slide.layout === "table") {
    const rows = list(slide.rows, 6).map((row) => list(row, 4));
    const w = 9 / Math.max(1, ...rows.map((row) => row.length));
    const h = Math.min(0.55, 3.3 / Math.max(1, rows.length));
    rows.forEach((row, r) => row.forEach((cell, c) => add({
      x: 0.5 + c * w, y: 1.8 + r * h, w, h, text: String(cell), size: 14, bold: r === 0, valign: "middle", pad: 0.12,
      color: r === 0 ? paper : ink, fill: r === 0 || r % 2 === 0 ? accent : undefined, fade: r === 0 ? 0 : 92,
    })));
  } else {
    const bullets = list(slide.bullets, 6);
    const step = Math.min(0.7, 3.3 / Math.max(1, bullets.length));
    bullets.forEach((line, i) => {
      const y = 1.85 + i * step;
      add({ x: 0.5, y: y + 0.1, w: 0.12, h: 0.12, fill: accent }, { x: 0.85, y, w: 8.65, h: step, text: line, size: 18, color: ink });
    });
  }
  return { bg, boxes };
}

// Builds the deck with pptxgenjs, loaded only when needed, and downloads it.
export async function save(slides: Slide[], palette: Palette, name: string) {
  const { default: Pptx } = await import("pptxgenjs");
  const deck = new Pptx();
  deck.layout = "LAYOUT_16x9";
  slides.forEach((item, index) => {
    const { bg, boxes } = draw(item, index, slides.length, palette);
    const slide = deck.addSlide();
    slide.background = { color: bg };
    for (const box of boxes) {
      slide.addText(box.text ?? "", {
        x: box.x, y: box.y, w: box.w, h: box.h,
        shape: box.round ? deck.ShapeType.ellipse : deck.ShapeType.rect,
        fill: box.fill ? { color: box.fill, transparency: box.fade ?? 0 } : undefined,
        fontFace: "Arial", fontSize: box.size ?? 14, color: box.color, bold: box.bold, italic: box.italic,
        align: box.align ?? "left", valign: box.valign ?? "top", margin: (box.pad ?? 0) * 72,
      });
    }
    if (item.notes) slide.addNotes(item.notes);
  });
  await deck.writeFile({ fileName: `${name}.pptx` });
}
