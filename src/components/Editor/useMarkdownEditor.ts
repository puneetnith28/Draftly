'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BlockType,
  ParsedBlock,
  parseMarkdownToBlocks,
  blocksToMarkdown,
} from '@/lib/markdownTransform';

let idCounter = 0;
function newId() {
  return `b_${Date.now()}_${idCounter++}`;
}

function createBlock(type: BlockType = 'p', text = ''): ParsedBlock {
  return { id: newId(), type, text, raw: '' };
}

export function useMarkdownEditor(
  initialContent: string,
  onChange: (markdown: string) => void
) {
  const [blocks, setBlocks] = useState<ParsedBlock[]>(() => {
    const parsed = parseMarkdownToBlocks(initialContent);
    return parsed.length > 0 ? parsed : [createBlock('h1')];
  });
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncToMarkdown = useCallback(
    (updated: ParsedBlock[]) => {
      onChange(blocksToMarkdown(updated));
    },
    [onChange]
  );

  const syncToMarkdownDebounced = useCallback(
    (updated: ParsedBlock[]) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToMarkdown(updated);
      }, 300);
    },
    [syncToMarkdown]
  );

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      blockRefs.current.set(id, el);
    } else {
      blockRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    blocks,
    setBlocks,
    focusedBlockId,
    setFocusedBlockId,
    registerRef,
    syncToMarkdownDebounced,
  };
}
