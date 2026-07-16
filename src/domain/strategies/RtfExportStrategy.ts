import { ExportStrategy } from './ExportStrategy';
import { DocumentEntity } from '../entities/Document';
import { parseMarkdownToBlocks, ParsedBlock } from '../../lib/markdownTransform';

export class RtfExportStrategy implements ExportStrategy {
  public async export(documentEntity: DocumentEntity): Promise<Blob> {
    const blocks = parseMarkdownToBlocks(documentEntity.content);
    
    const rtfLines = [
      '{\\rtf1\\ansi\\deff0',
      '{\\fonttbl{\\f0 Georgia;}{\\f1 Courier New;}}',
      '{\\colortbl;\\red26\\green26\\blue26;}',
      '\\cf1\\f0\\fs28\\sl360\\slmult1',
      '',
    ];

    for (const block of blocks) {
      switch (block.type) {
        case 'h1':
          rtfLines.push(`{\\b\\fs48 ${this.inlineToRtf(block.text || '')}}\\par\\par`);
          break;
        case 'h2':
          rtfLines.push(`{\\b\\fs36 ${this.inlineToRtf(block.text || '')}}\\par\\par`);
          break;
        case 'h3':
          rtfLines.push(`{\\b\\fs30 ${this.inlineToRtf(block.text || '')}}\\par\\par`);
          break;
        case 'h4':
        case 'h5':
        case 'h6':
          rtfLines.push(`{\\b\\fs26 ${this.inlineToRtf(block.text || '')}}\\par\\par`);
          break;
        case 'ul':
          rtfLines.push(`\\bullet\\tab ${this.inlineToRtf(block.text || '')}\\par`);
          break;
        case 'ol':
          rtfLines.push(`\\pard\\fi-360\\li720 ${this.inlineToRtf(block.text || '')}\\par`);
          break;
        case 'quote':
          rtfLines.push(`{\\i\\cf1 ${this.inlineToRtf(block.text || '')}}\\par\\par`);
          break;
        case 'code':
          rtfLines.push(`{\\f1\\fs22 ${this.escapeRtf(block.text || '')}}\\par\\par`);
          break;
        case 'hr':
          rtfLines.push('\\brdrb\\brdrs\\brdrw10\\brsp20 \\par');
          break;
        default:
          if (block.text) {
            rtfLines.push(`${this.inlineToRtf(block.text)}\\par\\par`);
          }
      }
    }

    rtfLines.push('}');
    const rtf = rtfLines.join('\n');
    return new Blob([rtf], { type: 'application/rtf' });
  }

  private escapeRtf(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
  }

  private inlineToRtf(text: string): string {
    let result = text.replace(/\*\*(.+?)\*\*/g, '{\\b $1}');
    result = result.replace(/\*(.+?)\*/g, '{\\i $1}');
    result = result.replace(/~~(.+?)~~/g, '{\\strike $1}');
    result = result.replace(/`([^`]+)`/g, '{\\f1 $1}');
    return this.escapeRtf(result);
  }
}
