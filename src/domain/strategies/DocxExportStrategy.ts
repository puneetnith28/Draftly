import { ExportStrategy } from './ExportStrategy';
import { DocumentEntity } from '../entities/Document';
import { parseMarkdownToBlocks } from '../../lib/markdownTransform';

export class DocxExportStrategy implements ExportStrategy {
  public async export(documentEntity: DocumentEntity): Promise<Blob> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

    const blocks = parseMarkdownToBlocks(documentEntity.content);
    const children: InstanceType<typeof Paragraph>[] = [];

    for (const block of blocks) {
      const text = block.text || '';

      const parseTextRuns = (raw: string): InstanceType<typeof TextRun>[] => {
        const runs: InstanceType<typeof TextRun>[] = [];
        const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`)/);
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
          } else if (part.startsWith('~~') && part.endsWith('~~')) {
            runs.push(new TextRun({ text: part.slice(2, -2), strike: true }));
          } else if (part.startsWith('`') && part.endsWith('`')) {
            runs.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New', size: 18 }));
          } else if (part) {
            runs.push(new TextRun(part));
          }
        }
        return runs;
      };

      const headingMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
        h1: HeadingLevel.HEADING_1,
        h2: HeadingLevel.HEADING_2,
        h3: HeadingLevel.HEADING_3,
        h4: HeadingLevel.HEADING_4,
        h5: HeadingLevel.HEADING_5,
        h6: HeadingLevel.HEADING_6,
      };

      if (block.type in headingMap) {
        children.push(
          new Paragraph({
            heading: headingMap[block.type],
            children: parseTextRuns(text),
          })
        );
      } else if (block.type === 'ul') {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: parseTextRuns(text),
          })
        );
      } else if (block.type === 'ol') {
        children.push(
          new Paragraph({
            numbering: { reference: 'default-numbering', level: 0 },
            children: parseTextRuns(text),
          })
        );
      } else if (block.type === 'quote') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text, italics: true, color: '555555' })],
            indent: { left: 720 },
          })
        );
      } else if (block.type === 'code') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text, font: 'Courier New', size: 18 })],
            shading: { fill: 'F5F5F5' } as never,
          })
        );
      } else if (block.type === 'hr') {
        children.push(new Paragraph({ text: '──────────────', alignment: AlignmentType.CENTER }));
      } else if (text) {
        children.push(new Paragraph({ children: parseTextRuns(text) }));
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    return Packer.toBlob(doc);
  }
}
