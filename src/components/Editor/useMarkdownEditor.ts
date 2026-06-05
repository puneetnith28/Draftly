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
  const savedSelectionRef = useRef<Range | null>(null);

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

  const cloneBlocks = useCallback((items: ParsedBlock[]) => items.map((b) => ({ ...b })), []);

  const applyBlocksChange = useCallback(
    (updater: (prev: ParsedBlock[]) => ParsedBlock[]) => {
      setBlocks((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        syncToMarkdownDebounced(next);
        return next;
      });
    },
    [syncToMarkdownDebounced]
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

  const getBlockIdFromRange = useCallback((range: Range): string | null => {
    let container = range.commonAncestorContainer as Node;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentNode as Node;
    }
    const el = container instanceof HTMLElement ? container : container.parentElement;
    if (!el) return null;
    const blockEl = el.closest('[data-block-id]') as HTMLElement | null;
    return blockEl?.getAttribute('data-block-id') ?? null;
  }, []);

  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      savedSelectionRef.current = null;
      return;
    }
    const range = sel.getRangeAt(0);
    if (!getBlockIdFromRange(range)) {
      savedSelectionRef.current = null;
      return;
    }
    savedSelectionRef.current = range.cloneRange();
  }, [getBlockIdFromRange]);

  const restoreCurrentSelection = useCallback(() => {
    if (!savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedSelectionRef.current);
  }, []);

  const getSelectedBlockId = useCallback((): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return getBlockIdFromRange(sel.getRangeAt(0));
  }, [getBlockIdFromRange]);

  const setCaretOffset = useCallback((el: HTMLElement, offset: number) => {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    let node = walker.nextNode() as Text | null;

    while (node) {
      const nodeText = node.nodeValue ?? '';
      const nextOffset = currentOffset + nodeText.length;
      if (offset <= nextOffset) {
        range.setStart(node, Math.max(0, offset - currentOffset));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      currentOffset = nextOffset;
      node = walker.nextNode() as Text | null;
    }

    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const placeCaretAfterRender = useCallback((blockId: string, offset: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(blockId);
        if (!el) return;
        const sel = window.getSelection();
        if (!sel) return;

        el.focus();
        const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let currentOffset = 0;
        let node = walker.nextNode() as Text | null;

        while (node) {
          const nodeText = node.nodeValue ?? '';
          const nextOffset = currentOffset + nodeText.length;
          if (offset <= nextOffset) {
            range.setStart(node, Math.max(0, offset - currentOffset));
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
          currentOffset = nextOffset;
          node = walker.nextNode() as Text | null;
        }

        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });
  }, []);

  const focusBlock = useCallback(
    (idOrIndex: string | number, atEnd = true) => {
      const doFocus = (bl: ParsedBlock[]) => {
        let el: HTMLElement | undefined;
        if (typeof idOrIndex === 'number') {
          const b = bl[idOrIndex];
          if (b) el = blockRefs.current.get(b.id);
        } else {
          el = blockRefs.current.get(idOrIndex);
        }
        if (!el) return;
        el.focus();
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          if (!sel) return;
          if (atEnd) {
            range.selectNodeContents(el);
            range.collapse(false);
          } else {
            range.setStart(el, 0);
            range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          // ignore
        }
      };

      requestAnimationFrame(() => {
        setBlocks((bl) => {
          doFocus(bl);
          return bl;
        });
      });
    },
    []
  );

  const handleArrowNavigation = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        let targetId: string | undefined;
        if (direction === 'up' && idx > 0) targetId = prev[idx - 1].id;
        if (direction === 'down' && idx < prev.length - 1) targetId = prev[idx + 1].id;
        if (targetId) {
          requestAnimationFrame(() => {
            const el = blockRefs.current.get(targetId!);
            if (el) {
              el.focus();
              try {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(direction === 'down');
                sel?.removeAllRanges();
                sel?.addRange(range);
              } catch { /* ignore */ }
            }
          });
        }
        return prev;
      });
    },
    []
  );

  const handleEnter = useCallback(
    (blockId: string, currentText: string, caretOffset: number) => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const current = prev[idx];
        const splitAt = Math.max(0, Math.min(caretOffset, currentText.length));
        const beforeText = currentText.slice(0, splitAt);
        const afterText = currentText.slice(splitAt);
        const newBlock = createBlock('p', afterText);
        if ((current.type === 'ul' || current.type === 'ol') && beforeText.trim()) {
          newBlock.type = current.type;
        }
        const updatedCurrent: ParsedBlock = { ...current, text: beforeText, raw: beforeText };
        const updated = [
          ...prev.slice(0, idx),
          updatedCurrent,
          newBlock,
          ...prev.slice(idx + 1),
        ];
        placeCaretAfterRender(newBlock.id, 0);
        return updated;
      });
    },
    [applyBlocksChange, placeCaretAfterRender]
  );

  const handleBackspaceOnEmpty = useCallback(
    (blockId: string) => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const block = prev[idx];
        if (block.type !== 'p') {
          return prev.map((b, i) =>
            i === idx ? { ...b, type: 'p' as BlockType, text: '', raw: '' } : b
          );
        }
        if (prev.length === 1) return prev;
        const updated = prev.filter((_, i) => i !== idx);
        const prevIdx = Math.max(0, idx - 1);
        const prevBlock = updated[prevIdx];
        requestAnimationFrame(() => {
          const el = prevBlock ? blockRefs.current.get(prevBlock.id) : undefined;
          if (el) {
            el.focus();
            try {
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(el);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            } catch { /* ignore */ }
          }
        });
        return updated;
      });
    },
    [applyBlocksChange]
  );

  const mergeBlockWithPrevious = useCallback(
    (blockId: string) => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx <= 0) return prev;
        const previous = prev[idx - 1];
        const current = prev[idx];
        const previousEl = blockRefs.current.get(previous.id);
        const caretOffset = previousEl?.textContent?.length ?? previous.text.length;
        const mergedText = `${previous.text}${current.text}`;
        const mergedPrevious: ParsedBlock = {
          ...previous,
          type: previous.type === 'hr' ? 'p' : previous.type,
          text: mergedText,
          raw: mergedText,
        };
        const updated = [
          ...prev.slice(0, idx - 1),
          mergedPrevious,
          ...prev.slice(idx + 1),
        ];
        placeCaretAfterRender(mergedPrevious.id, caretOffset);
        return updated;
      });
    },
    [applyBlocksChange, placeCaretAfterRender]
  );

  return {
    blocks,
    setBlocks,
    focusedBlockId,
    setFocusedBlockId,
    registerRef,
    syncToMarkdownDebounced,
    getBlockIdFromRange,
    saveCurrentSelection,
    restoreCurrentSelection,
    getSelectedBlockId,
    setCaretOffset,
    placeCaretAfterRender,
    focusBlock,
    handleArrowNavigation,
    handleEnter,
    handleBackspaceOnEmpty,
    mergeBlockWithPrevious,
  };
}
