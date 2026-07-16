import { DocumentEntity } from '../../domain/entities/Document';
import { ISearchIndexer } from '../../domain/services/ISearchIndexer';

export interface SearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export class SearchService implements ISearchIndexer {
  private index: Map<string, DocumentEntity> = new Map();

  public async indexDocument(document: DocumentEntity): Promise<void> {
    this.index.set(document.id, document);
  }

  public async removeDocument(documentId: string): Promise<void> {
    this.index.delete(documentId);
  }

  public async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) return results;

    for (const [id, doc] of this.index.entries()) {
      const lowerTitle = doc.title.toLowerCase();
      const lowerContent = doc.content.toLowerCase();
      
      let score = 0;
      if (lowerTitle.includes(lowerQuery)) score += 10;
      if (lowerContent.includes(lowerQuery)) score += 1;

      if (score > 0) {
        const contentIndex = lowerContent.indexOf(lowerQuery);
        let snippet = '';
        if (contentIndex !== -1) {
          const start = Math.max(0, contentIndex - 30);
          const end = Math.min(doc.content.length, contentIndex + lowerQuery.length + 30);
          snippet = (start > 0 ? '...' : '') + doc.content.substring(start, end) + (end < doc.content.length ? '...' : '');
        }

        results.push({
          documentId: id,
          title: doc.title,
          snippet: snippet || doc.content.substring(0, 60) + '...',
          score
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
