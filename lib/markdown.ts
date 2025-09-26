import katex from "katex";

export function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
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
    html = decodeHtmlEntities(html);

    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return `<div style="overflow-x:auto;padding:0.5rem 0;text-align:center">${katex.renderToString(cleanTex, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
            return `<code>${tex}</code>`;
        }
    });

    html = html.replace(/\$([^$]+?)\$/g, (match, tex) => {
        if (!tex || tex.trim().length === 0) return match;
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return katex.renderToString(cleanTex, { displayMode: false, throwOnError: false });
        } catch {
            return `<code>${tex}</code>`;
        }
    });

    return html;
}
