'use client';

import { detectBlockType, parseMarkdownToBlocks, blocksToMarkdown } from '@/lib/markdownTransform';
import { generateId } from '@shared/utils/idGenerator';
import { ParsedBlock } from '@shared/types';
import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { EditorBlock } from './EditorBlock';
import { FloatingToolbar } from './FloatingToolbar';
import { SlashMenu } from './SlashMenu';
import { BlockType } from '@shared/types';

interface EditorProps {
  docId: string;
  content: string;
  contentWidth: string;
  fontCss: string;
  sidebarOffset: number;
}

function createBlock(type: BlockType = 'p', text = ''): ParsedBlock {
  return { id: generateId('b'), type, text, raw: '', language: undefined };
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong><em>([\s\S]*?)<\/em><\/strong>/gi, '***$1***')
    .replace(/<em><strong>([\s\S]*?)<\/strong><\/em>/gi, '***$1***')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~')
    .replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"');
}

function tableDomToMarkdown(container: HTMLElement): string | null {
  const table = container.querySelector('table.editor-table');
  if (!table) return null;

  const headers = Array.from(
    table.querySelectorAll('thead th.editor-table-th:not(.table-add-col-th) .table-cell-input')
  ).map((cell) => htmlToMarkdown((cell as HTMLElement).innerHTML).trim());

  if (headers.length === 0) return null;

  const bodyRows = Array.from(table.querySelectorAll('tbody tr')).map((row) =>
    Array.from(
      row.querySelectorAll('td.editor-table-td:not(.table-row-actions) .table-cell-input')
    ).map((cell) => htmlToMarkdown((cell as HTMLElement).innerHTML).trim())
  );

  const rows = bodyRows.length > 0 ? bodyRows : [headers.map(() => '')];
  const separator = headers.map(() => '--------');

  return [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

export function Editor({ docId, content, contentWidth, fontCss, sidebarOffset}: EditorProps) {
  const prevDocIdRef = useRef(docId);

  const onChange = useCallback((markdown: string) => {
    import('../../infrastructure/di/container').then(({ engine }) => {
      engine.documents.getDocument(docId).then((doc) => {
        if (doc) {
          doc.updateContent(markdown);
          engine.documents.updateDocument(doc);
        }
      });
    });
  }, [docId]);

  const initialContent = content;

  const [blocks, setBlocks] = useState<ParsedBlock[]>(() => {
    const parsed = parseMarkdownToBlocks(initialContent);
    return parsed.length > 0 ? parsed : [createBlock('h1')];
  });
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const undoStackRef = useRef<ParsedBlock[][]>([]);
  const redoStackRef = useRef<ParsedBlock[][]>([]);
  const isApplyingHistoryRef = useRef(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const parseCacheRef = useRef<Map<string, { content: string; blocks: ParsedBlock[] }>>(new Map());
  const skipNextSyncRef = useRef(true);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const cloneBlocks = useCallback((items: ParsedBlock[]) => items.map((b) => ({ ...b })), []);

  const parseWithCache = useCallback(
    (docId: string, content: string): ParsedBlock[] => {
      const cached = parseCacheRef.current.get(docId);
      if (cached && cached.content === content) {
        return cloneBlocks(cached.blocks);
      }

      const parsed = parseMarkdownToBlocks(content);
      const normalized = parsed.length > 0 ? parsed : [createBlock('h1')];
      parseCacheRef.current.set(docId, { content, blocks: cloneBlocks(normalized) });
      return normalized;
    },
    [cloneBlocks]
  );

  const syncToMarkdown = useCallback(
    (updated: ParsedBlock[]) => {
      onChangeRef.current(blocksToMarkdown(updated));
    },
    []
  );

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncToMarkdownDebounced = useCallback(
    (updated: ParsedBlock[]) => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncToMarkdown(updated);
      }, 300);
    },
    [syncToMarkdown]
  );

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    syncToMarkdownDebounced(blocks);
  }, [blocks, syncToMarkdownDebounced]);

  const applyBlocksChange = useCallback(
    (updater: (prev: ParsedBlock[]) => ParsedBlock[]) => {
      setBlocks((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        if (!isApplyingHistoryRef.current) {
          undoStackRef.current.push(cloneBlocks(prev));
          if (undoStackRef.current.length > 200) undoStackRef.current.shift();
          redoStackRef.current = [];
        }
        return next;
      });
    },
    [cloneBlocks]
  );

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) blockRefs.current.set(id, el);
    else blockRefs.current.delete(id);
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

  const getSelectedBlockId = useCallback((): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return getBlockIdFromRange(sel.getRangeAt(0));
  }, [getBlockIdFromRange]);


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
        } catch { /* ignore */ }
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

  const handleTextChange = useCallback(
    (blockId: string, rawText: string) => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;

        const detected = detectBlockType(rawText);
        if (detected && detected.type !== 'p') {
          const updated = prev.map((b, i) =>
            i === idx
              ? { ...b, type: detected.type, text: detected.text, raw: rawText, language: detected.language }
              : b
          );
          requestAnimationFrame(() => {
            const el = blockRefs.current.get(blockId);
            if (el) {
              el.textContent = detected.text;
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
        }
        return prev.map((b, i) =>
          i === idx ? { ...b, text: rawText, raw: rawText } : b
        );
      });
    },
    [applyBlocksChange]
  );

  const handleBackspaceOnEmpty = useCallback(
    (blockId: string) => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const block = prev[idx];
        if (block.type !== 'p') {
          return prev.map((b, i) =>
            i === idx ? { ...b, type: 'p' as BlockType, text: '', raw: '', language: undefined } : b
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
  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          const maxSize = 1024;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImagePaste = useCallback(
    (blockId: string, file: File): boolean => {
      if (!file.type.startsWith('image/')) return false;

      compressImage(file).then((dataUrl) => {
        const imageBlock: ParsedBlock = {
          id: generateId('b'),
          type: 'p',
          text: `![Pasted image](${dataUrl})`,
          raw: `![Pasted image](${dataUrl})`,
        };
        applyBlocksChange((prev) => {
          const idx = prev.findIndex((b) => b.id === blockId);
          const updated = [
            ...prev.slice(0, idx + 1),
            imageBlock,
            ...prev.slice(idx + 1),
          ];
          requestAnimationFrame(() => {
            const el = blockRefs.current.get(imageBlock.id);
            el?.focus();
          });
          return updated;
        });
      });
      return true;
    },
    [applyBlocksChange, compressImage]
  );

  const handleMarkdownPaste = useCallback(
    (blockId: string, markdownText: string): boolean => {
      Promise.resolve().then(() => {
        const pastedBlocks = parseMarkdownToBlocks(markdownText).map((b) => ({
          ...b,
          id: generateId('b'),
        }));
        if (pastedBlocks.length === 0) return;
        applyBlocksChange((prev) => {
          const idx = prev.findIndex((b) => b.id === blockId);
          if (idx === -1) return prev;
          const target = prev[idx];
          const shouldReplaceTarget =
            !target.text.trim() && (target.type === 'p' || target.type === 'h1');
          const insertStart = shouldReplaceTarget ? idx : idx + 1;
          const tailStart = idx + 1;
          const updated = [
            ...prev.slice(0, insertStart),
            ...pastedBlocks,
            ...prev.slice(tailStart),
          ];
          const lastPasted = pastedBlocks[pastedBlocks.length - 1];
          requestAnimationFrame(() => {
            const el = blockRefs.current.get(lastPasted.id);
            el?.focus();
          });
          return updated;
        });
      });
      return true;
    },
    [applyBlocksChange]
  );

  const applyBlockFormat = useCallback(
    (type: BlockType) => {
      const targetBlockId = focusedBlockId ?? getSelectedBlockId();
      if (!targetBlockId) return;
      applyBlocksChange((prev) => {
        return prev.map((b) =>
          b.id === targetBlockId
            ? { ...b, type, language: type === 'code' ? (b.language ?? 'plaintext') : undefined }
            : b
        );
      });
      setFocusedBlockId(targetBlockId);
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(targetBlockId);
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
    },
    [focusedBlockId, getSelectedBlockId, applyBlocksChange]
  );

  const applyInlineFormat = useCallback((format: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText.trim().length) return;

    const startEl =
      (range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element)) ?? null;
    const endEl =
      (range.endContainer.nodeType === Node.TEXT_NODE
        ? range.endContainer.parentElement
        : (range.endContainer as Element)) ?? null;
    const startBlock = startEl?.closest('[data-block-id]') as HTMLElement | null;
    const endBlock = endEl?.closest('[data-block-id]') as HTMLElement | null;
    if (!startBlock || !endBlock || startBlock !== endBlock) return;

    const blockEl = startBlock;
    if (!blockEl) return;

    const blockId = blockEl.getAttribute('data-block-id');
    if (!blockId) return;

    const safe = selectedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (format === 'bold') {
      document.execCommand('insertHTML', false, `<strong>${safe}</strong>`);
    }
    else if (format === 'italic') {
      document.execCommand('insertHTML', false, `<em>${safe}</em>`);
    }
    else if (format === 'strikethrough') {
      document.execCommand('insertHTML', false, `<del>${safe}</del>`);
    }
    else if (format === 'code') {
      document.execCommand('insertHTML', false, `<code>${safe}</code>`);
    } else if (format === 'link') {
      document.execCommand('insertHTML', false, `<a href="https://">${safe}</a>`);
    } else {
      return;
    }
    const selectionToRestore = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;

    requestAnimationFrame(() => {
      const el = blockRefs.current.get(blockId);
      if (!el) return;
      const fullText = tableDomToMarkdown(el) ?? htmlToMarkdown(el.innerHTML);
      setBlocks((prev) => {
        return prev.map((b) =>
          b.id === blockId ? { ...b, text: fullText, raw: fullText } : b
        );
      });
      setFocusedBlockId(blockId);

      if (selectionToRestore) {
        requestAnimationFrame(() => {
          const sel = window.getSelection();
          if (sel) {
            try {
              sel.removeAllRanges();
              sel.addRange(selectionToRestore);
              savedSelectionRef.current = selectionToRestore.cloneRange();
            } catch {
            }
          }
        });
      }
    });
  }, [syncToMarkdown]);
  const insertBlock = useCallback(
    (type: BlockType, text = '') => {
      const insertAfter = focusedBlockId;
      applyBlocksChange((prev) => {
        const idx = insertAfter
          ? prev.findIndex((b) => b.id === insertAfter)
          : prev.length - 1;
        const newBlock = createBlock(type, text);
        if (type === 'code') newBlock.language = 'plaintext';
        const updated = [
          ...prev.slice(0, idx + 1),
          newBlock,
          ...prev.slice(idx + 1),
        ];
        requestAnimationFrame(() => {
          const el = blockRefs.current.get(newBlock.id);
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
    [focusedBlockId, applyBlocksChange]
  );

  const moveBlock = useCallback(
    (blockId: string, dir: 'up' | 'down') => {
      applyBlocksChange((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        if (dir === 'up' && idx === 0) return prev;
        if (dir === 'down' && idx === prev.length - 1) return prev;
        const updated = [...prev];
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
        return updated;
      });
    },
    [applyBlocksChange]
  );
  const moveBlockToPosition = useCallback(
    (draggedId: string, targetId: string, position: 'before' | 'after') => {
      applyBlocksChange((prev) => {
        const draggedIdx = prev.findIndex((b) => b.id === draggedId);
        const targetIdx = prev.findIndex((b) => b.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return prev;

        const updated = prev.filter((b) => b.id !== draggedId);
        let insertIdx = updated.findIndex((b) => b.id === targetId);
        if (position === 'after') {
          insertIdx += 1;
        }
        updated.splice(insertIdx, 0, prev[draggedIdx]);
        return updated;
      });
    },
    [applyBlocksChange]
  );


  const deleteBlock = useCallback(
    (blockId: string) => {
      applyBlocksChange((prev) => {
        if (prev.length === 1) {
          return [createBlock('h1', '')];
        }
        const idx = prev.findIndex((b) => b.id === blockId);
        const updated = prev.filter((b) => b.id !== blockId);
        const focusIdx = Math.max(0, idx - 1);
        requestAnimationFrame(() => {
          const target = updated[focusIdx];
          if (target) {
            const el = blockRefs.current.get(target.id);
            el?.focus();
          }
        });
        return updated;
      });
    },
    [applyBlocksChange]
  );

  const updateCodeLanguage = useCallback(
    (blockId: string, language: string) => {
      applyBlocksChange((prev) =>
        prev.map((b) =>
          b.id === blockId ? { ...b, language: language.trim() ? language : undefined } : b
        )
      );
    },
    [applyBlocksChange]
  );
  const clearDocument = useCallback(() => {
    applyBlocksChange(() => [createBlock('h1', '')]);
    setFocusedBlockId(null);
  }, [applyBlocksChange]);

  const undo = useCallback(() => {
    setBlocks((prev) => {
      const previous = undoStackRef.current.pop();
      if (!previous) return prev;
      isApplyingHistoryRef.current = true;
      redoStackRef.current.push(cloneBlocks(prev));
      const restored = cloneBlocks(previous);
      isApplyingHistoryRef.current = false;
      return restored;
    });
    setFocusedBlockId(null);
  }, [cloneBlocks]);

  const redo = useCallback(() => {
    setBlocks((prev) => {
      const next = redoStackRef.current.pop();
      if (!next) return prev;
      isApplyingHistoryRef.current = true;
      undoStackRef.current.push(cloneBlocks(prev));
      const restored = cloneBlocks(next);
      isApplyingHistoryRef.current = false;
      return restored;
    });
    setFocusedBlockId(null);
  }, [cloneBlocks]);

  const loadContent = useCallback((docId: string, content: string) => {
    const parsed = parseWithCache(docId, content);
    skipNextSyncRef.current = true;
    setBlocks(parsed);
    setFocusedBlockId(null);
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, [parseWithCache]);

  useEffect(() => {
    return () => {

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);



  useEffect(() => {
    if (prevDocIdRef.current !== docId) {
      prevDocIdRef.current = docId;
      loadContent(docId, content);
    }
  }, [docId, content, loadContent]);

  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    blockId: string;
    x: number;
    y: number;
    query: string;
  }>({ isOpen: false, blockId: '', x: 0, y: 0, query: '' });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredLength, setFilteredLength] = useState(0);

  const handleSlashTrigger = useCallback((blockId: string, el: HTMLElement, query: string) => {
    const rect = el.getBoundingClientRect();
    const containerEl = el.closest('.editor-doc-container');
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    const x = rect.left - containerRect.left;
    const y = rect.bottom - containerRect.top + 4;

    setSlashMenu({
      isOpen: true,
      blockId,
      x,
      y,
      query,
    });
    setSelectedIndex(0);
  }, []);

  const handleSlashClose = useCallback(() => {
    setSlashMenu({ isOpen: false, blockId: '', x: 0, y: 0, query: '' });
  }, []);

  const handleSlashSelect = useCallback((type: string) => {
    const blockId = slashMenu.blockId;
    setSlashMenu({ isOpen: false, blockId: '', x: 0, y: 0, query: '' });

    if (type === 'table') {
      const tableTemplate = `| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell     | Cell     | Cell     |`;
      handleTextChange(blockId, tableTemplate);
      applyBlockFormat('table');
    } else if (type === 'hr') {
      handleTextChange(blockId, '---');
      applyBlockFormat('hr');
    } else {
      handleTextChange(blockId, '');
      applyBlockFormat(type as BlockType);
    }

    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
      el?.focus();
    });
  }, [slashMenu.blockId, handleTextChange, applyBlockFormat]);

  const handleSlashMenuKey = useCallback((key: string) => {
    if (!slashMenu.isOpen || filteredLength === 0) return;
    if (key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev + 1) % filteredLength);
    } else if (key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev - 1 + filteredLength) % filteredLength);
    } else if (key === 'Enter') {
      const q = slashMenu.query.toLowerCase().trim();
      const items = [
        { type: 'p', label: 'Paragraph' },
        { type: 'h1', label: 'Heading 1' },
        { type: 'h2', label: 'Heading 2' },
        { type: 'h3', label: 'Heading 3' },
        { type: 'ul', label: 'Bullet list' },
        { type: 'ol', label: 'Numbered list' },
        { type: 'quote', label: 'Quote block' },
        { type: 'code', label: 'Code block' },
        { type: 'table', label: 'Table' },
        { type: 'hr', label: 'Divider' },
      ];
      const filtered = q
        ? items.filter((item) => item.label.toLowerCase().includes(q))
        : items;
      
      const selected = filtered[selectedIndex];
      if (selected) {
        handleSlashSelect(selected.type);
      }
    } else if (key === 'Escape') {
      handleSlashClose();
    }
  }, [slashMenu.isOpen, slashMenu.query, selectedIndex, filteredLength, handleSlashSelect, handleSlashClose]);

  const handleEditorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock) {
          const el = document.querySelector(`[data-block-id="${lastBlock.id}"]`) as HTMLElement;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const clickY = e.clientY;
          if (clickY >= rect.bottom) {
            el.focus();
          }
        }
      }
    },
    [blocks]
  );

  const handleToolbarFormat = useCallback(
    (action: string, value?: string) => {
      restoreCurrentSelection();

      const inlineFormats = ['bold', 'italic', 'strikethrough', 'link'];
      if (inlineFormats.includes(action)) {
        applyInlineFormat(action);
        return;
      }

      if (action === 'code') {
        const sel = window.getSelection();
        const selectedText = sel?.toString() ?? '';
        if (selectedText.length > 0) {
          applyInlineFormat('code');
        } else {
          insertBlock('code');
        }
        return;
      }

      if (action === 'codeblock') {
        insertBlock('code');
        return;
      }

      if (action === 'quote') {
        applyBlockFormat('quote');
        return;
      }

      if (action === 'ul') {
        applyBlockFormat('ul');
        return;
      }

      if (action === 'ol') {
        applyBlockFormat('ol');
        return;
      }

      if (action === 'table') {
        const tableTemplate = `| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell     | Cell     | Cell     |`;
        insertBlock('table', tableTemplate);
        return;
      }

      if (action === 'image') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file && focusedBlockId) {
            handleImagePaste(focusedBlockId, file);
          }
        };
        input.click();
        return;
      }

      if (action === 'hr') {
        insertBlock('hr');
        return;
      }

      if (/^h[1-6]$/.test(action)) {
        applyBlockFormat(action as BlockType);
        return;
      }

      if (action === 'p') {
        applyBlockFormat('p');
        return;
      }
    },
    [applyBlockFormat, applyInlineFormat, insertBlock, focusedBlockId, handleImagePaste, restoreCurrentSelection]
  );

  const handleToolbarInteract = useCallback(() => {
    saveCurrentSelection();
    requestAnimationFrame(() => {
      restoreCurrentSelection();
    });
  }, [restoreCurrentSelection, saveCurrentSelection]);

  const handleBlockBlur: (id: string) => void = useCallback((_id: string) => {
  }, []);

  const blocksWithOrdinals = useMemo<Array<{ block: typeof blocks[number]; listOrdinal: number | null }>>(() => {
    let currentOrdinal = 0;

    return blocks.map((block, index) => {
      const previousBlock = blocks[index - 1];
      const isOrderedList = block.type === 'ol';
      const isContinuation = isOrderedList && previousBlock?.type === 'ol';

      if (isOrderedList) {
        currentOrdinal = isContinuation ? currentOrdinal + 1 : 1;
      } else {
        currentOrdinal = 0;
      }

      return {
        block,
        listOrdinal: isOrderedList ? currentOrdinal : null,
      };
    });
  }, [blocks]);

  return (
    <div
      className="flex-1 overflow-y-auto relative editor-scroll-area"
      style={{ background: 'var(--bg-editor)' }}
    >
      <div
        style={{
          maxWidth: contentWidth,
          width: '100%',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          className="editor-doc-container"
          data-editor-doc="true"
          style={{ fontFamily: fontCss }}
          onMouseUp={saveCurrentSelection}
          onKeyUp={saveCurrentSelection}
          onClick={handleEditorClick}
        >
          {blocksWithOrdinals.map(({ block, listOrdinal }, idx: number) => (
            <EditorBlock
              key={block.id}
              block={block}
              isFirst={idx === 0}
              isFocused={focusedBlockId === block.id}
              blockIndex={idx}
              totalBlocks={blocks.length}
              listOrdinal={listOrdinal}
              onFocus={setFocusedBlockId}
              onBlur={handleBlockBlur}
              onTextChange={handleTextChange}
              onEnter={handleEnter}
              onBackspaceEmpty={handleBackspaceOnEmpty}
              onBackspaceJoinPrevious={mergeBlockWithPrevious}
              onArrow={handleArrowNavigation}
              onImagePaste={handleImagePaste}
              onMarkdownPaste={handleMarkdownPaste}
              onCodeLanguageChange={updateCodeLanguage}
              onClearDocument={clearDocument}
              onUndo={undo}
              onRedo={redo}
              onMoveBlock={moveBlock}
              onMoveBlockToPosition={moveBlockToPosition}
              onDeleteBlock={deleteBlock}
              registerRef={registerRef}
              slashMenuOpen={slashMenu.isOpen && slashMenu.blockId === block.id}
              activeSlashBlockId={slashMenu.blockId}
              onSlashTrigger={handleSlashTrigger}
              onSlashClose={handleSlashClose}
              onSlashMenuKey={handleSlashMenuKey}
            />
          ))}
          {/* Bottom spacer */}
          <div className="editor-bottom-spacer" onClick={handleEditorClick} />
        </div>

        {slashMenu.isOpen && (
          <SlashMenu
            x={slashMenu.x}
            y={slashMenu.y}
            query={slashMenu.query}
            selectedIndex={selectedIndex}
            onSelect={handleSlashSelect}
            onClose={handleSlashClose}
            setFilteredLength={setFilteredLength}
          />
        )}
      </div>

      <FloatingToolbar
        focusedBlockId={focusedBlockId}
        blocks={blocks}
        sidebarOffset={sidebarOffset}
        onAction={handleToolbarFormat}
        onToolbarInteract={handleToolbarInteract}
      />
    </div>
  );
}
