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

  public updateText(newText: string): void {
    this.text = newText;
  }

  public updateType(newType: BlockType): void {
    this.type = newType;
  }

  public abstract serialize(): string;

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
