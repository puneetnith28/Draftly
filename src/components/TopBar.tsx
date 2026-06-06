'use client';

import React from 'react';
import { Document } from '@/types';

interface TopBarProps {
  activeDocument: Document | null;
  onTitleChange: (id: string, title: string) => void;
  savingStatus: 'idle' | 'saving' | 'saved';
}

export const TopBar: React.FC<TopBarProps> = ({
  activeDocument,
  onTitleChange,
  savingStatus,
}) => {
  if (!activeDocument) {
    return (
      <header className="topbar-container">
        <div className="topbar-empty">No active document</div>
      </header>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(activeDocument.id, e.target.value);
  };

  const renderStatus = () => {
    switch (savingStatus) {
      case 'saving':
        return <span className="topbar-status saving">Saving...</span>;
      case 'saved':
        return <span className="topbar-status saved">Saved</span>;
      default:
        return <span className="topbar-status idle">Synced</span>;
    }
  };

  return (
    <header className="topbar-container">
      <div className="topbar-title-section">
        <input
          type="text"
          value={activeDocument.title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="topbar-title-input"
        />
        {renderStatus()}
      </div>
    </header>
  );
};
