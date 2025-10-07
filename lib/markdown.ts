import katex from "katex";

const ALLOWED_TAGS = new Set([
    "a",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
]);

const DANGEROUS_TAGS = new Set([
    "embed",
    "iframe",
    "link",
    "meta",
    "object",
    "script",
    "style",
]);

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function sanitizeHtml(html: string): string {
    if (typeof document === "undefined" || !html) return html;

    const template = document.createElement("template");
    template.innerHTML = html;

    const elements = Array.from(template.content.querySelectorAll("*"));
    for (const element of elements) {
        const tag = element.tagName.toLowerCase();

        if (DANGEROUS_TAGS.has(tag)) {
            element.remove();
            continue;
        }

        if (!ALLOWED_TAGS.has(tag)) {
            const text = document.createTextNode(element.textContent || "");
            element.replaceWith(text);
            continue;
        }

        for (const attr of Array.from(element.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim();

            const isSafeHref = name === "href" &&
                /^(https?:|mailto:|\/|#)/i.test(value);
            const isAllowedAttr = name === "class" ||
                name === "title" ||
                name === "colspan" ||
                name === "rowspan" ||
                isSafeHref;

            if (!isAllowedAttr || name.startsWith("on")) {
                element.removeAttribute(attr.name);
            }
        }
    }

    return template.innerHTML;
}

export function normalizeMathDelimiters(input: string): string {
    const fencedSplit = input.split(/(```[\s\S]*?```)/g);
    const processInline = (segment: string) => {
        const inlineSplit = segment.split(/(`[^`]*`)/g);
        return inlineSplit
            .map((part) => {
                if (part.startsWith("`") && part.endsWith("`")) return part;
                let replaced = part.replace(/\\\[([\\s\S]*?)\\\]/g, (_, p1) => `$$${p1}$$`);
                replaced = replaced.replace(/\\\(([^]*?)\\\)/g, (_, p1) => `$${p1}$`);
                return replaced;
            })
            .join("");
    };
    return fencedSplit
        .map((seg) => (seg.startsWith("```") ? seg : processInline(seg)))
        .join("");
}

export function renderMath(html: string): string {
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return `<div style="overflow-x:auto;padding:0.5rem 0;text-align:center">${katex.renderToString(cleanTex, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
            return `<code>${escapeHtml(tex)}</code>`;
        }
    });

    html = html.replace(/\$([^$]+?)\$/g, (match, tex) => {
        if (!tex || tex.trim().length === 0) return match;
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return katex.renderToString(cleanTex, { displayMode: false, throwOnError: false });
        } catch {
            return `<code>${escapeHtml(tex)}</code>`;
        }
    });

    return html;
}
