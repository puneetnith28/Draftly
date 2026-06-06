'use client';

import React, { useRef, useEffect } from 'react';
import { ParsedBlock } from '@/types';
import { parseInlineMarkdown, parseTableMarkdown } from '@/lib/markdownTransform';
import { htmlToMarkdown, tableDomToMarkdown } from './useMarkdownEditor';

const LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'html',
  'css',
  'python',
  'rust',
  'go',
  'sql',
  'json',
  'markdown',
];

interface EditorBlockProps {
  block: ParsedBlock;
  isFocused: boolean;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (id: string, e: React.KeyboardEvent<HTMLElement>) => void;
  onFocus: (id: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onLanguageChange?: (id: string, language: string) => void;
}

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  isFocused,
  onTextChange,
  onKeyDown,
  onFocus,
  registerRef,
  onLanguageChange,
}) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isFocused && elementRef.current) {
      if (document.activeElement !== elementRef.current) {
        elementRef.current.focus();
      }
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const markdown = block.type === 'table' ? tableDomToMarkdown(el) : htmlToMarkdown(el.innerHTML);
    onTextChange(block.id, markdown);
  };

  const handleFocus = () => {
    onFocus(block.id);
  };

  const setRef = (el: HTMLElement | null) => {
    elementRef.current = el;
    registerRef(block.id, el);
  };

  const innerHtml =
    block.type === 'code'
      ? block.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      : parseInlineMarkdown(block.text);

  const commonProps = {
    ref: setRef as any,
    contentEditable: block.type !== 'hr',
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onKeyDown(block.id, e),
    onFocus: handleFocus,
    'data-block-id': block.id,
    className: `editor-block-content ${block.type}`,
  };

  switch (block.type) {
    case 'h1':
      return <h1 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'h2':
      return <h2 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'h3':
      return <h3 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'h4':
      return <h4 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'h5':
      return <h5 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'h6':
      return <h6 {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'quote':
      return <blockquote {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
    case 'ul':
      return (
        <ul className="editor-ul">
          <li {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />
        </ul>
      );
    case 'ol':
      return (
        <ol className="editor-ol">
          <li {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />
        </ol>
      );
    case 'hr':
      return (
        <div
          ref={setRef as any}
          className="editor-hr-container"
          onFocus={handleFocus}
          data-block-id={block.id}
          tabIndex={0}
          onKeyDown={(e) => onKeyDown(block.id, e)}
        >
          <hr className="editor-hr" />
        </div>
      );
    case 'code':
      const currentLang = block.language || 'plaintext';
      const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onLanguageChange?.(block.id, e.target.value);
      };
      const handleCopy = () => {
        navigator.clipboard.writeText(block.text).then(() => {
        });
      };
      return (
        <div className="editor-code-container" data-block-id={block.id}>
          <div className="editor-code-header" contentEditable={false}>
            <select
              value={currentLang}
              onChange={handleLanguageSelect}
              className="editor-code-lang-select"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <button onClick={handleCopy} className="editor-code-copy-btn">
              Copy
            </button>
          </div>
          <pre {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />
        </div>
      );
    case 'table':
      const handleTableChange = () => {
        const el = elementRef.current;
        if (el) {
          onTextChange(block.id, tableDomToMarkdown(el));
        }
      };

      const handleAddRow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elementRef.current;
        if (!el) return;
        const tbody = el.querySelector('tbody');
        if (!tbody) return;
        const lastRow = tbody.querySelector('tr') || el.querySelector('thead tr');
        if (!lastRow) return;
        const colCount = lastRow.cells.length;

        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
          const td = document.createElement('td');
          td.innerHTML = 'Cell';
          newRow.appendChild(td);
        }
        tbody.appendChild(newRow);
        handleTableChange();
      };

      const handleAddColumn = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elementRef.current;
        if (!el) return;

        const theadRow = el.querySelector('thead tr');
        if (theadRow) {
          const th = document.createElement('th');
          th.innerHTML = 'Header';
          theadRow.appendChild(th);
        }

        const bodyRows = el.querySelectorAll('tbody tr');
        bodyRows.forEach((row) => {
          const td = document.createElement('td');
          td.innerHTML = 'Cell';
          row.appendChild(td);
        });

        handleTableChange();
      };

      const handleDeleteRow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elementRef.current;
        if (!el) return;
        const tbody = el.querySelector('tbody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        if (rows.length <= 1) return;
        rows[rows.length - 1].remove();
        handleTableChange();
      };

      const handleDeleteColumn = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elementRef.current;
        if (!el) return;

        const theadRow = el.querySelector('thead tr');
        if (theadRow && theadRow.cells.length <= 1) return;

        if (theadRow) {
          theadRow.cells[theadRow.cells.length - 1].remove();
        }

        const bodyRows = el.querySelectorAll('tbody tr');
        bodyRows.forEach((row) => {
          if (row.cells.length > 0) {
            row.cells[row.cells.length - 1].remove();
          }
        });

        handleTableChange();
      };

      return (
        <div className="editor-table-container" data-block-id={block.id}>
          <div className="editor-table-header" contentEditable={false}>
            <button onClick={handleAddRow} className="editor-table-btn">
              + Row
            </button>
            <button onClick={handleAddColumn} className="editor-table-btn">
              + Col
            </button>
            <button onClick={handleDeleteRow} className="editor-table-btn">
              - Row
            </button>
            <button onClick={handleDeleteColumn} className="editor-table-btn">
              - Col
            </button>
          </div>
          <div
            {...commonProps}
            dangerouslySetInnerHTML={{ __html: parseTableMarkdown(block.text) }}
          />
        </div>
      );
    default:
      return <p {...commonProps} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
  }
};
