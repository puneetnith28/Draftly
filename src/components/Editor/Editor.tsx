'use client';

import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useMarkdownEditor } from './useMarkdownEditor';
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
  onChange: (markdown: string) => void;
}

export function Editor({ docId, content, contentWidth, fontCss, sidebarOffset, onChange }: EditorProps) {
  const prevDocIdRef = useRef(docId);

  const {
    blocks,
    focusedBlockId,
    setFocusedBlockId,
    registerRef,
    saveCurrentSelection,
    restoreCurrentSelection,
    handleEnter,
    handleTextChange,
    handleBackspaceOnEmpty,
    mergeBlockWithPrevious,
    handleArrowNavigation,
    handleImagePaste,
    handleMarkdownPaste,
    applyBlockFormat,
    applyInlineFormat,
    insertBlock,
    moveBlock,
    moveBlockToPosition,
    deleteBlock,
    updateCodeLanguage,
    clearDocument,
    undo,
    redo,
    loadContent,
  } = useMarkdownEditor(content, onChange);

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
