import { BlockType, ParsedBlock } from '@shared/types';
import { generateId } from '@shared/utils/idGenerator';

export abstract class BlockEntity implements ParsedBlock {
  public id: string;
  public type: BlockType;
  public text: string;
  public raw: string;
  public language?: string;

  protected constructor(data: ParsedBlock) {
    this.id = data.id;
    this.type = data.type;
    this.text = data.text;
    this.raw = data.raw;
    this.language = data.language;
  }

  /**
   * Updates the visible text content of the block.
   */
  public updateText(newText: string): void {
    this.text = newText;
  }

  /**
   * Updates the block's type (e.g., from 'p' to 'h1').
   */
  public updateType(newType: BlockType): void {
    this.type = newType;
  }

  /**
   * Every specific block (Heading, Table, Paragraph) must know how to serialize 
   * its internal state into a standard Markdown string.
   * This enforces the Liskov Substitution Principle (LSP).
   */
  public abstract serialize(): string;

  /**
   * Protected helper to generate a standardized base payload for new blocks.
   */
  protected static createBasePayload(type: BlockType, text: string, language?: string): ParsedBlock {
    return {
      id: generateId('b'),
      type,
      text,
      raw: '',
      language,
    };
  }
}
