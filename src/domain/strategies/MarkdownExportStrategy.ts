import { ExportStrategy } from './ExportStrategy';
import { DocumentEntity } from '../entities/Document';

export class MarkdownExportStrategy implements ExportStrategy {
  public async export(document: DocumentEntity): Promise<Blob> {
    const rawContent = document.content;
    const finalContent = rawContent.trim() ? rawContent : '# Untitled\n';
    
    return new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });
  }
}
