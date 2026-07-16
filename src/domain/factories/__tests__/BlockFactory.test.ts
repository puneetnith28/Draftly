import { BlockFactory } from '../BlockFactory';
import { HeadingBlock } from '../../entities/blocks/HeadingBlock';
import { CodeBlock } from '../../entities/blocks/CodeBlock';
import { ParagraphBlock } from '../../entities/blocks/ParagraphBlock';
import { ParsedBlock } from '@shared/types';

describe('BlockFactory', () => {
  describe('createNew()', () => {
    it('should create a HeadingBlock when type is h1', () => {
      const block = BlockFactory.createNew('h1', 'Title');
      expect(block).toBeInstanceOf(HeadingBlock);
      expect(block.serialize()).toBe('# Title\n');
    });

    it('should create a CodeBlock when type is code', () => {
      const block = BlockFactory.createNew('code', 'console.log()', 'javascript');
      expect(block).toBeInstanceOf(CodeBlock);
      expect(block.serialize()).toBe('```javascript\nconsole.log()\n```\n');
    });

    it('should default to ParagraphBlock for unknown types', () => {
      const block = BlockFactory.createNew('unknown', 'Hello');
      expect(block).toBeInstanceOf(ParagraphBlock);
      expect(block.serialize()).toBe('Hello\n');
    });
  });

  describe('reconstitute()', () => {
    it('should rehydrate a JSON payload into a concrete BlockEntity', () => {
      const payload: ParsedBlock = {
        id: 'b_123',
        type: 'h2',
        text: 'Subtitle',
        raw: '## Subtitle'
      };
      
      const block = BlockFactory.reconstitute(payload);
      expect(block).toBeInstanceOf(HeadingBlock);
      expect(block.id).toBe('b_123');
      expect(block.serialize()).toBe('## Subtitle\n');
    });
  });
});
