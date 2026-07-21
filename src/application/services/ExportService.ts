import { DocumentEntity } from '@domain/entities/Document';
import { ExportStrategy } from '@domain/strategies/ExportStrategy';
import { MarkdownExportStrategy } from '@domain/strategies/MarkdownExportStrategy';
import { PdfExportStrategy } from '@domain/strategies/PdfExportStrategy';
import { DocxExportStrategy } from '@domain/strategies/DocxExportStrategy';
import { RtfExportStrategy } from '@domain/strategies/RtfExportStrategy';

export class ExportService {
  private static customStrategies = new Map<string, ExportStrategy>();

  private strategy: ExportStrategy;

  constructor(strategy?: ExportStrategy) {
    this.strategy = strategy || new MarkdownExportStrategy();
  }

  public setStrategy(strategy: ExportStrategy): void {
    this.strategy = strategy;
  }

  public async export(document: DocumentEntity): Promise<Blob> {
    return this.strategy.export(document);
  }

  public static registerStrategy(format: string, strategy: ExportStrategy) {
    this.customStrategies.set(format, strategy);
  }

  public static getStrategyByFormat(format: string): ExportStrategy {
    if (this.customStrategies.has(format)) {
      return this.customStrategies.get(format)!;
    }

    switch (format) {
      case 'pdf':
        return new PdfExportStrategy();
      case 'docx':
        return new DocxExportStrategy();
      case 'rtf':
        return new RtfExportStrategy();
      case 'md':
      default:
        return new MarkdownExportStrategy();
    }
  }
}
