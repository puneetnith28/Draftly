import { ExportStrategy } from './ExportStrategy';
import { DocumentEntity } from '../entities/Document';
import jsPDF from 'jspdf';
import { parseMarkdownToBlocks } from '../../lib/markdownTransform';

export class PdfExportStrategy implements ExportStrategy {
  public async export(document: DocumentEntity): Promise<Blob> {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(document.title || 'Untitled', 20, yPosition);
    yPosition += 15;
    
    const blocks = parseMarkdownToBlocks(document.content);
    
    for (const block of blocks) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }

      if (block.type === 'h1') {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
      } else if (block.type.startsWith('h')) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      }

      const text = block.text ? block.text : '';
      const lines = pdf.splitTextToSize(text, 170);
      
      pdf.text(lines, 20, yPosition);
      yPosition += (lines.length * (pdf.getFontSize() * 0.4)) + 5;
    }

    return pdf.output('blob');
  }
}
