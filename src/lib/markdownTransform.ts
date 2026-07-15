import { BlockType, ParsedBlock } from '@shared/types';
import { generateId } from '@shared/utils/idGenerator';

export interface BlockDetection {
  type: BlockType;
  text: string;
  raw: string;
  language?: string;
}

export function detectBlockType(rawLine: string): BlockDetection | null {
  const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    return {
      type: `h${level}` as BlockType,
      text: headingMatch[2],
      raw: rawLine,
    };
  }

  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(rawLine)) {
    return {
      type: 'hr',
      text: '',
      raw: rawLine,
    };
  }

  const ulMatch = rawLine.match(/^[-*+]\s+(.*)/);
  if (ulMatch) {
    return {
      type: 'ul',
      text: ulMatch[1],
      raw: rawLine,
    };
  }

  const olMatch = rawLine.match(/^\d+\.\s+(.*)/);
  if (olMatch) {
    return {
      type: 'ol',
      text: olMatch[1],
      raw: rawLine,
    };
  }

  const quoteMatch = rawLine.match(/^>\s?(.*)/);
  if (quoteMatch) {
    return {
      type: 'quote',
      text: quoteMatch[1],
      raw: rawLine,
    };
  }

  if (rawLine.startsWith('```')) {
    const language = rawLine.slice(3).trim();
    return {
      type: 'code',
      text: '',
      raw: rawLine,
      language: language || undefined,
    };
  }
  return null;
}

export function blockTypeToPrefixedText(type: BlockType, text: string): string {
  switch (type) {
    case 'h1': return `# ${text}`;
    case 'h2': return `## ${text}`;
    case 'h3': return `### ${text}`;
    case 'h4': return `#### ${text}`;
    case 'h5': return `##### ${text}`;
    case 'h6': return `###### ${text}`;
    case 'ul': return `- ${text}`;
    case 'ol': return `1. ${text}`;
    case 'quote': return `> ${text}`;
    case 'code': return `\`\`\`${text}`;
    case 'hr': return '---';
    default: return text;
  }
}

export function parseInlineMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/(\*{3}|_{3})(.+?)\1/g, '<strong><em>$2</em></strong>');
  html = html.replace(/(\*{2}|_{2})(.+?)\1/g, '<strong>$2</strong>');
  html = html.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  return html;
}



export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const md = typeof markdown === 'string' ? markdown : '';
  if (!md.trim()) {
    return [{ id: generateId('b'), type: 'h1', text: '', raw: '' }];
  }

  const lines = md.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({
        id: generateId('b'),
        type: 'code',
        text: codeLines.join('\n'),
        raw: `\`\`\`${lang}\n${codeLines.join('\n')}\n\`\`\``,
        language: lang || undefined,
      });
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: generateId('b'),
        type: 'table',
        text: tableLines.join('\n'),
        raw: tableLines.join('\n'),
      });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const detected = detectBlockType(line);
    if (detected) {
      blocks.push({
        id: generateId('b'),
        type: detected.type,
        text: detected.text,
        raw: detected.raw,
        language: detected.language,
      });
    } else {
      blocks.push({
        id: generateId('b'),
        type: 'p',
        text: line,
        raw: line,
      });
    }
    i++;
  }

  if (blocks.length === 0) {
    blocks.push({ id: generateId('b'), type: 'h1', text: '', raw: '' });
  }

  return blocks;
}

export function blocksToMarkdown(blocks: ParsedBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h1': return `# ${block.text}`;
        case 'h2': return `## ${block.text}`;
        case 'h3': return `### ${block.text}`;
        case 'h4': return `#### ${block.text}`;
        case 'h5': return `##### ${block.text}`;
        case 'h6': return `###### ${block.text}`;
        case 'ul': return `- ${block.text}`;
        case 'ol': return `1. ${block.text}`;
        case 'quote': return `> ${block.text}`;
        case 'code': return `\`\`\`\n${block.text}\n\`\`\``;
        case 'hr': return '---';
        case 'table': return block.text;
        default: return block.text;
      }
    })
    .join('\n\n');
}

export function parseTableMarkdown(tableRaw: string): string {
  const rows = tableRaw
    .split('\n')
    .map((line) =>
      line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1)
    );

  if (rows.length < 2) return tableRaw;

  const [header, , ...body] = rows;
  const isAlignRow = (row: string[]) => row.every((c) => /^[-:]+$/.test(c));

  const headerHtml = header
    .map((cell) => `<th>${parseInlineMarkdown(cell)}</th>`)
    .join('');

  const bodyHtml = body
    .filter((row) => !isAlignRow(row))
    .map((row) => `<tr>${row.map((cell) => `<td>${parseInlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

export type { ParsedBlock };
