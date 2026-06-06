'use client';

import {
  ParsedBlock,
  parseMarkdownToBlocks,
  parseInlineMarkdown,
  parseTableMarkdown,
} from './markdownTransform';

export function blocksToHtml(blocks: ParsedBlock[]): string {
  let html = '';
  blocks.forEach((block) => {
    switch (block.type) {
      case 'h1':
        html += `<h1>${parseInlineMarkdown(block.text)}</h1>\n`;
        break;
      case 'h2':
        html += `<h2>${parseInlineMarkdown(block.text)}</h2>\n`;
        break;
      case 'h3':
        html += `<h3>${parseInlineMarkdown(block.text)}</h3>\n`;
        break;
      case 'h4':
        html += `<h4>${parseInlineMarkdown(block.text)}</h4>\n`;
        break;
      case 'h5':
        html += `<h5>${parseInlineMarkdown(block.text)}</h5>\n`;
        break;
      case 'h6':
        html += `<h6>${parseInlineMarkdown(block.text)}</h6>\n`;
        break;
      case 'ul':
        html += `<ul><li>${parseInlineMarkdown(block.text)}</li></ul>\n`;
        break;
      case 'ol':
        html += `<ol><li>${parseInlineMarkdown(block.text)}</li></ol>\n`;
        break;
      case 'quote':
        html += `<blockquote>${parseInlineMarkdown(block.text)}</blockquote>\n`;
        break;
      case 'code':
        const escaped = block.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `<pre><code class="language-${block.language || 'text'}">${escaped}</code></pre>\n`;
        break;
      case 'hr':
        html += `<hr />\n`;
        break;
      case 'table':
        html += parseTableMarkdown(block.text) + '\n';
        break;
      default:
        html += `<p>${parseInlineMarkdown(block.text)}</p>\n`;
        break;
    }
  });

  html = html.replace(/<\/ul>\n<ul>/g, '\n');
  html = html.replace(/<\/ol>\n<ol>/g, '\n');

  return html;
}

function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToMarkdown(title: string, markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled'}.md`;
  downloadBlob(blob, filename);
}

export function exportToHtml(title: string, markdown: string) {
  const blocks = parseMarkdownToBlocks(markdown);
  const bodyHtml = blocksToHtml(blocks);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Untitled'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 750px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #111827;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h1 { font-size: 2.25em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    h2 { font-size: 1.75em; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
    h3 { font-size: 1.35em; }
    p { margin-top: 0; margin-bottom: 16px; color: #374151; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { margin-top: 0; margin-bottom: 16px; padding-left: 24px; }
    li { margin-bottom: 4px; }
    blockquote {
      margin: 16px 0;
      padding-left: 16px;
      border-left: 4px solid #e5e7eb;
      color: #4b5563;
      font-style: italic;
    }
    pre {
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background-color: #f3f4f6;
      padding: 2px 4px;
      border-radius: 4px;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    hr {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 32px 0;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled'}.html`;
  downloadBlob(blob, filename);
}
