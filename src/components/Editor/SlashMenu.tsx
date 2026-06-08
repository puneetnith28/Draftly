'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Heading1, Heading2, Heading3, Type, List, ListOrdered,
  Quote, Code, Table, Minus
} from 'lucide-react';

export interface SlashMenuItem {
  type: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface SlashMenuProps {
  x: number;
  y: number;
  query: string;
  selectedIndex: number;
  onSelect: (type: string) => void;
  onClose: () => void;
  setFilteredLength: (len: number) => void;
}

export function SlashMenu({
  x,
  y,
  query,
  selectedIndex,
  onSelect,
  onClose,
  setFilteredLength
}: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const items: SlashMenuItem[] = useMemo(() => [
    { type: 'p', label: 'Paragraph', desc: 'Plain text', icon: <Type size={16} /> },
    { type: 'h1', label: 'Heading 1', desc: 'Large heading', icon: <Heading1 size={16} /> },
    { type: 'h2', label: 'Heading 2', desc: 'Medium heading', icon: <Heading2 size={16} /> },
    { type: 'h3', label: 'Heading 3', desc: 'Small heading', icon: <Heading3 size={16} /> },
    { type: 'ul', label: 'Bullet list', desc: 'Simple bullet list', icon: <List size={16} /> },
    { type: 'ol', label: 'Numbered list', desc: 'Sequential list', icon: <ListOrdered size={16} /> },
    { type: 'quote', label: 'Quote block', desc: 'Capture a quote', icon: <Quote size={16} /> },
    { type: 'code', label: 'Code block', desc: 'Syntax highlighted code', icon: <Code size={16} /> },
    { type: 'table', label: 'Table', desc: 'Data table grid', icon: <Table size={16} /> },
    { type: 'hr', label: 'Divider', desc: 'Horizontal line break', icon: <Minus size={16} /> },
  ], []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setFilteredLength(filtered.length);
  }, [filtered.length, setFilteredLength]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const activeEl = menuEl.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="glass"
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 100,
        background: 'var(--bg-toolbar)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-modal)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minWidth: '220px',
        maxWidth: '300px',
        maxHeight: '280px',
        overflowY: 'auto',
      }}
    >
      {filtered.map((item, idx) => {
        const isActive = idx === selectedIndex;
        return (
          <button
            key={item.type}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item.type);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? 'var(--bg-active)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontFamily: 'var(--font-ui)',
              transition: 'background 0.1s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: isActive ? 'var(--accent-glow)' : 'var(--bg-hover)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {item.desc}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
