'use client';

import React, { useEffect } from 'react';
import { useMarkdownEditor } from './useMarkdownEditor';
import { EditorBlock } from './EditorBlock';
import { FloatingToolbar } from './FloatingToolbar';

interface EditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange }) => {
  const {
    blocks,
    setBlocks,
    focusedBlockId,
    setFocusedBlockId,
    registerRef,
    handleTextChange,
    handleArrowNavigation,
    handleEnter,
    handleBackspaceOnEmpty,
    applyInlineFormat,
    undo,
    redo,
  } = useMarkdownEditor(initialContent, onChange);

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (modifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal);
    };
  }, [undo, redo]);

  const handleKeyDown = (id: string, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      handleEnter(id, e);
    } else if (e.key === 'Backspace') {
      handleBackspaceOnEmpty(id, e);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      handleArrowNavigation(id, e);
    }
  };

  const handleLanguageChange = (id: string, language: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, language } : b))
    );
  };

  return (
    <div className="editor-workspace">
      <div className="editor-paper">
        {blocks.map((block) => (
          <EditorBlock
            key={block.id}
            block={block}
            isFocused={focusedBlockId === block.id}
            onTextChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onFocus={setFocusedBlockId}
            registerRef={registerRef}
            onLanguageChange={handleLanguageChange}
          />
        ))}
      </div>
      <FloatingToolbar applyInlineFormat={applyInlineFormat} />
    </div>
  );
};
