import katex from "katex";
import { marked } from "marked";
import "katex/dist/katex.min.css";

const tags = new Set(["A", "BLOCKQUOTE", "BR", "CODE", "DEL", "EM", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "LI", "OL", "P", "PRE", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "UL"]);
const math = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

// Keeps only safe tags, classes and http links from model output.
function sanitize(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const element of Array.from(template.content.querySelectorAll("*"))) {
    if (!tags.has(element.tagName)) {
      element.replaceWith(element.textContent ?? "");
      continue;
    }
    for (const { name, value } of Array.from(element.attributes)) {
      if (name !== "class" && !(name === "href" && /^(https?:|#)/i.test(value))) element.removeAttribute(name);
    }
  }
  return template.innerHTML;
}

// Renders markdown with KaTeX math into sanitized HTML.
export function render(markdown: string) {
  if (!markdown) return "";
  const formulas: string[] = [];
  const text = markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, index) => index % 2 ? part : part.replace(math, (_, block, bracket, inline, paren) => {
      const display = block ?? bracket;
      formulas.push(katex.renderToString(display ?? inline ?? paren, { displayMode: display !== undefined, throwOnError: false }));
      return `@@${formulas.length - 1}@@`;
    }))
    .join("");
  return sanitize(marked.parse(text, { async: false })).replace(/@@(\d+)@@/g, (_, index) => formulas[Number(index)]);
}

// Saves text as a markdown file.
export function download(name: string, content: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
