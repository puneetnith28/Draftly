import React, { useState } from 'react';
import { ParsedBlock } from '@shared/types';
import { KanbanBoardData } from './KanbanBlockEntity';

interface KanbanComponentProps {
  block: ParsedBlock;
  onBlockUpdate?: (updates: Partial<ParsedBlock>) => void;
  isFocused: boolean;
  onFocus: () => void;
}

export function KanbanComponent({ block, onBlockUpdate, isFocused, onFocus }: KanbanComponentProps) {
  const defaultColumns = [
    { id: 'col-1', title: 'To Do', cards: [{ id: 'card-1', content: 'New Task' }] },
    { id: 'col-2', title: 'In Progress', cards: [] },
    { id: 'col-3', title: 'Done', cards: [] }
  ];

  const boardData: KanbanBoardData = block.metadata?.boardData || { columns: defaultColumns };

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const updateBoard = (newData: KanbanBoardData) => {
    if (onBlockUpdate) {
      onBlockUpdate({ metadata: { ...block.metadata, boardData: newData } });
    }
  };

  const handleAddCard = (colId: string) => {
    const newData = { ...boardData };
    const col = newData.columns.find(c => c.id === colId);
    if (col) {
      col.cards.push({ id: `card-${Date.now()}`, content: 'New Task' });
      updateBoard(newData);
    }
  };

  const handleCardChange = (colId: string, cardId: string, content: string) => {
    const newData = { ...boardData };
    const col = newData.columns.find(c => c.id === colId);
    if (col) {
      const card = col.cards.find(c => c.id === cardId);
      if (card) {
        card.content = content;
        updateBoard(newData);
      }
    }
  };

  const handleDeleteCard = (colId: string, cardId: string) => {
    const newData = { ...boardData };
    const col = newData.columns.find(c => c.id === colId);
    if (col) {
      col.cards = col.cards.filter(c => c.id !== cardId);
      updateBoard(newData);
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedCardId) return;

    let cardToMove: { id: string; content: string } | null = null;
    const newData = { ...boardData };
    
    for (const col of newData.columns) {
      const idx = col.cards.findIndex(c => c.id === draggedCardId);
      if (idx !== -1) {
        cardToMove = col.cards[idx];
        col.cards.splice(idx, 1);
        break;
      }
    }

    if (cardToMove) {
      const targetCol = newData.columns.find(c => c.id === targetColId);
      if (targetCol) {
        targetCol.cards.push(cardToMove);
      }
    }

    updateBoard(newData);
    setDraggedCardId(null);
  };

  return (
    <div 
      className={`kanban-plugin-board ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onFocus}
      contentEditable={false} // Board is interactive but not directly text editable
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'var(--bg-secondary, #f9fafb)',
        borderRadius: '12px',
        overflowX: 'auto',
        minHeight: '200px',
        userSelect: 'none' // Prevent text selection while dragging
      }}
    >
      {boardData.columns.map(col => (
        <div 
          key={col.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{
            minWidth: '250px',
            background: 'var(--bg-toolbar, #ffffff)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {col.title} ({col.cards.length})
          </div>

          {col.cards.map(card => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, card.id)}
              style={{
                background: 'var(--bg-editor, #ffffff)',
                border: '1px solid var(--border-default, #e5e7eb)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'grab',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <textarea 
                value={card.content}
                onChange={(e) => handleCardChange(col.id, card.id, e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)'
                }}
                rows={2}
              />
              <button 
                onClick={() => handleDeleteCard(col.id, card.id)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted, #9ca3af)', 
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => handleAddCard(col.id)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: '1px dashed var(--border-default, #e5e7eb)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary, #6b7280)',
              marginTop: '4px',
              fontSize: '13px'
            }}
          >
            + Add Card
          </button>
        </div>
      ))}
    </div>
  );
}
