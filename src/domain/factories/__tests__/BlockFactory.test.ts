import { BlockFactory } from '../BlockFactory';
import { ParagraphBlock } from '../../entities/blocks/ParagraphBlock';
import { HeadingBlock } from '../../entities/blocks/HeadingBlock';
import { CodeBlock } from '../../entities/blocks/CodeBlock';
import { QuoteBlock } from '../../entities/blocks/QuoteBlock';
import { TableBlock } from '../../entities/blocks/TableBlock';

describe('BlockFactory', () => {
  it('should create a ParagraphBlock by default if type is p', () => {
    const block = BlockFactory.createNew('p', 'Hello world');
    expect(block).toBeInstanceOf(ParagraphBlock);
    expect(block.text).toBe('Hello world');
    expect(block.id).toBeDefined();
  });

  it('should create a HeadingBlock', () => {
    const block = BlockFactory.createNew('h1', 'Heading');
    expect(block).toBeInstanceOf(HeadingBlock);
    expect(block.type).toBe('h1');
  });

  it('should create a CodeBlock', () => {
    const block = BlockFactory.createNew('code', 'console.log()');
    expect(block).toBeInstanceOf(CodeBlock);
    expect(block.type).toBe('code');
  });

  it('should create a QuoteBlock', () => {
    const block = BlockFactory.createNew('quote', 'To be or not to be');
    expect(block).toBeInstanceOf(QuoteBlock);
    expect(block.type).toBe('quote');
  });

  it('should create a TableBlock', () => {
    const block = BlockFactory.createNew('table', 'Col1 | Col2');
    expect(block).toBeInstanceOf(TableBlock);
    expect(block.type).toBe('table');
  });
});
