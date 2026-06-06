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

export function exportToPdf(title: string, markdown: string) {
  if (typeof window === 'undefined') return;
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
    @media print {
      body {
        margin: 20px;
        color: #000;
      }
    }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  }
}

function cleanRtfText(text: string): string {
  let rtf = text
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}');
  
  rtf = rtf.replace(/(\*{3}|_{3})(.+?)\1/g, '{\\b\\i $2}');
  rtf = rtf.replace(/(\*{2}|_{2})(.+?)\1/g, '{\\b $2}');
  rtf = rtf.replace(/(\*|_)(.+?)\1/g, '{\\i $2}');
  rtf = rtf.replace(/~~(.+?)~~/g, '{\\strike $2}');
  rtf = rtf.replace(/`([^`]+)`/g, '{\\f1 $1}');
  rtf = rtf.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  
  return rtf;
}

export function exportToRtf(title: string, markdown: string) {
  const blocks = parseMarkdownToBlocks(markdown);
  let rtfBody = '';
  let olCounter = 1;

  blocks.forEach((block, idx) => {
    if (idx > 0 && blocks[idx - 1].type !== 'ol') {
      olCounter = 1;
    }

    const cleanText = cleanRtfText(block.text);

    switch (block.type) {
      case 'h1':
        rtfBody += `\\fs48\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'h2':
        rtfBody += `\\fs36\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'h3':
        rtfBody += `\\fs28\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'h4':
        rtfBody += `\\fs24\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'h5':
        rtfBody += `\\fs20\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'h6':
        rtfBody += `\\fs16\\b ${cleanText}\\b0\\par\\par\n`;
        break;
      case 'ul':
        rtfBody += `\\li360\\bullet  ${cleanText}\\par\n`;
        break;
      case 'ol':
        rtfBody += `\\li360 ${olCounter}. ${cleanText}\\par\n`;
        olCounter++;
        break;
      case 'quote':
        rtfBody += `\\li720\\i ${cleanText}\\i0\\par\\par\n`;
        break;
      case 'code':
        const codeLines = block.text
          .split('\n')
          .map((line) => `\\li360\\f1 ${cleanRtfText(line)}`)
          .join('\\par\n');
        rtfBody += `${codeLines}\\par\\par\n`;
        break;
      case 'hr':
        rtfBody += `\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par\\pard\\par\n`;
        break;
      case 'table':
        const rows = block.text
          .split('\n')
          .map((row) =>
            row
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean)
          );
        let tableRtf = '';
        rows.forEach((row) => {
          if (row.length === 0 || row.every((c) => /^[-:]+$/.test(c))) return;
          tableRtf += '\\li360 ' + row.map((c) => cleanRtfText(c)).join(' \\tab ') + '\\par\n';
        });
        rtfBody += `${tableRtf}\\par\n`;
        break;
      default:
        rtfBody += `${cleanText}\\par\\par\n`;
        break;
    }
  });

  const fullRtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fmodern\\fcharset0 Courier New;}}
\\viewkind4\\uc1\\pard\\f0\\fs24
\\fs56\\b ${cleanRtfText(title)}\\b0\\par\\par
${rtfBody}
}`;

  const blob = new Blob([fullRtf], { type: 'application/rtf;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled'}.rtf`;
  downloadBlob(blob, filename);
}

export function exportToDocx(title: string, markdown: string) {
  const blocks = parseMarkdownToBlocks(markdown);
  const bodyHtml = blocksToHtml(blocks);
  
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title || 'Untitled'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    h1 { font-size: 24pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
    h2 { font-size: 18pt; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
    p { margin-top: 0; margin-bottom: 12pt; }
    ul, ol { margin-top: 0; margin-bottom: 12pt; padding-left: 20pt; }
    li { margin-bottom: 3pt; }
    blockquote {
      margin: 12pt 0;
      padding-left: 12pt;
      border-left: 3pt solid #cccccc;
      color: #666666;
      font-style: italic;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10pt;
      border: 1px solid #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 12pt 0;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background-color: #f5f5f5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15pt 0;
    }
    th, td {
      border: 1px solid #cccccc;
      padding: 6pt 8pt;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled'}.docx`;
  downloadBlob(blob, filename);
}
