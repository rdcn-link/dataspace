import { Marked, type MarkedOptions, type Tokens } from 'marked';
import katex from 'katex';

// Tokenize before Markdown consumes TeX backslashes; code tokens remain untouched.
const parser = new Marked({ gfm: true, breaks: true });
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]!));

function renderMath(token: Tokens.Generic): string {
  try {
    return katex.renderToString(token.text, {
      displayMode: token.displayMode,
      throwOnError: true,
      trust: false,
      strict: 'ignore',
      maxExpand: 1000,
      maxSize: 20,
      output: 'htmlAndMathml',
    });
  } catch {
    // Invalid or unfinished streamed expressions must never break the message.
    return `<span class="math-source">${escapeHtml(token.raw)}</span>`;
  }
}

parser.use({ extensions: [
  {
    name: 'mathBlock', level: 'block',
    start: (src: string) => src.match(/(?:^|\n) {0,3}(?:\$\$|\\\[)/)?.index,
    tokenizer(src: string) {
      const match = /^(?: {0,3})\$\$([\s\S]+?)\$\$(?:[ \t]*(?:\n|$))/.exec(src)
        || /^(?: {0,3})\\\[([\s\S]+?)\\\](?:[ \t]*(?:\n|$))/.exec(src);
      if (match) return { type: 'mathBlock', raw: match[0], text: match[1].trim(), displayMode: true };
    },
    renderer: renderMath,
  },
  {
    name: 'mathInline', level: 'inline',
    start: (src: string) => src.search(/\\[([]|\$/) < 0 ? undefined : src.search(/\\[([]|\$/),
    tokenizer(src: string) {
      const match = /^\\\(([\s\S]+?)\\\)/.exec(src)
        || /^\\\[([\s\S]+?)\\\]/.exec(src)
        || /^\$\$([\s\S]+?)\$\$/.exec(src)
        || /^\$(?!\s|\$)([^\n$]+?)(?<!\s|\\)\$(?!\d)/.exec(src);
      if (match) return {
        type: 'mathInline', raw: match[0], text: match[1].trim(),
        displayMode: src.startsWith('\\[') || src.startsWith('$$'),
      };
    },
    renderer: renderMath,
  },
] });

// Callers sanitize the complete HTML (including math) at their existing boundary.
export function parseMarkdown(text: string, options: MarkedOptions = {}): string {
  return parser.parse(text, { ...options, async: false }) as string;
}
