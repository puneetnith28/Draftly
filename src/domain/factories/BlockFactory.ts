import { BlockEntity } from '../entities/Block';
import { ParagraphBlock } from '../entities/blocks/ParagraphBlock';
import { HeadingBlock } from '../entities/blocks/HeadingBlock';
import { CodeBlock } from '../entities/blocks/CodeBlock';
import { ListBlock } from '../entities/blocks/ListBlock';
import { QuoteBlock } from '../entities/blocks/QuoteBlock';
import { DividerBlock } from '../entities/blocks/DividerBlock';
import { TableBlock } from '../entities/blocks/TableBlock';
import { ParsedBlock } from '@shared/types';

export class BlockFactory {
  private static customCreators = new Map<string, (text: string, ...args: any[]) => BlockEntity>();
  private static customReconstituters = new Map<string, (data: ParsedBlock) => BlockEntity>();

  public static registerCustomBlockType(
    type: string,
    creator: (text: string, ...args: any[]) => BlockEntity,
    reconstituter: (data: ParsedBlock) => BlockEntity
  ) {
    this.customCreators.set(type, creator);
    this.customReconstituters.set(type, reconstituter);
  }

  public static reconstitute(data: ParsedBlock): BlockEntity {
    if (this.customReconstituters.has(data.type)) {
      return this.customReconstituters.get(data.type)!(data);
    }

    if (data.type.startsWith('h')) {
      return new HeadingBlock(data);
    }
    
    switch (data.type) {
      case 'code':
        return new CodeBlock(data);
      case 'ul':
      case 'ol':
        return new ListBlock(data);
      case 'quote':
        return new QuoteBlock(data);
      case 'hr':
        return new DividerBlock(data);
      case 'table':
        return new TableBlock(data);
      case 'p':
      default:
        return new ParagraphBlock(data);
    }
  }

  public static createNew(type: string, text: string, language?: string): BlockEntity {
    if (this.customCreators.has(type)) {
      return this.customCreators.get(type)!(text, language);
    }

    if (type.startsWith('h')) {
      const level = parseInt(type.charAt(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      return HeadingBlock.create(text, level || 1);
    }

    switch (type) {
      case 'code':
        return CodeBlock.create(text, language);
      case 'ul':
      case 'ol':
        return ListBlock.create(text, type);
      case 'quote':
        return QuoteBlock.create(text);
      case 'hr':
        return DividerBlock.create();
      case 'table':
        return TableBlock.create(text);
      case 'p':
      default:
        return ParagraphBlock.create(text);
    }
  }
}
