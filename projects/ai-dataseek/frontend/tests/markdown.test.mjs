import assert from 'node:assert/strict';
import test from 'node:test';
import { Marked, Renderer } from 'marked';
import { parseMarkdown } from '../src/utils/markdown.ts';

test('renders the reported W–H equation and inline definitions before Markdown escapes TeX', () => {
  const html = parseMarkdown(String.raw`### W-H 方程
\[
\beta_{\text{total}} \cos\theta = \frac{K\lambda}{D} + 4\varepsilon \sin\theta
\]
其中 \(\beta_{\text{total}}\)，\(\lambda = 1.5406\) Å，\(K=0.9\)。`);
  assert.equal((html.match(/class="katex"/g) || []).length, 4);
  assert.match(html, /katex-display/);
  assert.match(html, /<math /);
  assert.match(html, /mfrac/);
});

test('supports dollar math in prose, tables, lists and multiline aligned equations', () => {
  for (const input of [String.raw`Inline $x^2$ and $$y=2$$.`,
    String.raw`- \(x^2\)`, '| quantity | value |\n|---|---|\n| E | $x^2$ |',
    '$$\n\\begin{aligned}a&=b\\\\c&=d\\end{aligned}\n$$']) {
    assert.match(parseMarkdown(input), /class="katex"/);
    assert.doesNotMatch(parseMarkdown(input), /math-source/);
  }
});

test('leaves code, escaped dollars, prices, ordinary brackets and links unchanged', () => {
  for (const input of ['`\\(x\\)`', '```latex\n\\[x\\]\n```',
    '    $$x$$\n', String.raw`Price \$5 and \$10`, 'Price $5 and $10',
    '[ordinary](https://example.com)', '(ordinary) [brackets]']) {
    assert.doesNotMatch(parseMarkdown(input), /class="katex"/);
    assert.equal(parseMarkdown(input), new Marked({ gfm: true, breaks: true }).parse(input));
  }
});

test('handles partial streaming input and malformed expressions without throwing', () => {
  const expression=String.raw`Formula: \[\frac{K\lambda}{D}\]`;
  for(let i=0;i<=expression.length;i++) assert.doesNotThrow(()=>parseMarkdown(expression.slice(0,i)));
  const invalid=parseMarkdown(String.raw`\(\notACommand{<script>alert(1)</script>}\)`);
  assert.match(invalid,/math-source/);
  assert.doesNotMatch(invalid,/<script>/);
});

test('untrusted TeX cannot create active links, images or HTML attributes', () => {
  for(const input of [String.raw`\(\href{javascript:alert(1)}{click}\)`,
    String.raw`\(\includegraphics{https://example.com/tracker}\)`,
    String.raw`\(\htmlClass{injected}{x}\)`]) {
    const html=parseMarkdown(input);
    assert.doesNotMatch(html,/<(?:a|img)\b|class="injected"/);
  }
});

test('custom code toolbar renderers coexist with math and do not leak across calls', () => {
  const renderer=new Renderer();renderer.code=()=>'<pre data-test="toolbar">code</pre>';
  assert.match(parseMarkdown('```py\nx=1\n```\n\n$x$',{renderer}),/data-test="toolbar"/);
  assert.doesNotMatch(parseMarkdown('```py\nx=1\n```'),/data-test="toolbar"/);
});
