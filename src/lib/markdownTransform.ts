import { BlockType } from '@/types';

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
