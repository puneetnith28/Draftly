'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FloatingToolbarProps {
  applyInlineFormat: (format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link') => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ applyInlineFormat }) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setCoords(null);
        return;
      }

      const range = selection.getRangeAt(0);

      let node: Node | null = range.commonAncestorContainer;
      let isInsideEditor = false;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (
            el.hasAttribute('data-block-id') ||
            el.classList.contains('editor-block-content') ||
            el.closest('[data-block-id]')
          ) {
            isInsideEditor = true;
            break;
          }
        }
        node = node.parentNode;
      }

      if (!isInsideEditor) {
        setCoords(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      const toolbarHeight = 44;
      setCoords({
        top: rect.top + window.scrollY - toolbarHeight - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  if (!coords) return null;

  const handleAction = (
    e: React.MouseEvent,
    format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link'
  ) => {
    e.preventDefault();
    applyInlineFormat(format);
  };

  return (
    <div
      ref={toolbarRef}
      className="editor-floating-toolbar"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      <button
        onMouseDown={(e) => handleAction(e, 'bold')}
        className="editor-toolbar-btn font-bold"
        title="Bold"
      >
        B
      </button>
      <button
        onMouseDown={(e) => handleAction(e, 'italic')}
        className="editor-toolbar-btn italic"
        title="Italic"
      >
        I
      </button>
      <button
        onMouseDown={(e) => handleAction(e, 'strikethrough')}
        className="editor-toolbar-btn line-through"
        title="Strikethrough"
      >
        S
      </button>
      <button
        onMouseDown={(e) => handleAction(e, 'code')}
        className="editor-toolbar-btn font-mono"
        title="Code"
      >
        &lt;/&gt;
      </button>
      <button
        onMouseDown={(e) => handleAction(e, 'link')}
        className="editor-toolbar-btn"
        title="Link"
      >
        🔗
      </button>
    </div>
  );
};
