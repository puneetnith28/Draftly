'use client';

import React, { useState } from 'react';
import { Document } from '@/types';

interface TopBarProps {
  activeDocument: Document | null;
  onTitleChange: (id: string, title: string) => void;
  savingStatus: 'idle' | 'saving' | 'saved';
  onToggleSidebar: () => void;
  onOpenPreferences: () => void;
  onExport: (format: 'md' | 'html' | 'pdf' | 'rtf' | 'docx') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeDocument,
  onTitleChange,
  savingStatus,
  onToggleSidebar,
  onOpenPreferences,
  onExport,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!activeDocument) {
    return (
      <header className="topbar-container">
        <button onClick={onToggleSidebar} className="topbar-toggle-btn" title="Toggle Sidebar">
          ☰
        </button>
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

  const handleExportSelect = (format: 'md' | 'html' | 'pdf' | 'rtf' | 'docx') => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <header className="topbar-container">
      <div className="topbar-left">
        <button onClick={onToggleSidebar} className="topbar-toggle-btn" title="Toggle Sidebar">
          ☰
        </button>
      </div>

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

      <div className="topbar-right">
        <button onClick={onOpenPreferences} className="topbar-action-btn" title="Preferences">
          ⚙️ Settings
        </button>

        <div className="topbar-export-container">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="topbar-action-btn"
            title="Export Document"
          >
            📤 Export
          </button>

          {showExportMenu && (
            <div className="topbar-export-dropdown">
              <button onClick={() => handleExportSelect('md')} className="topbar-dropdown-item">
                Markdown (.md)
              </button>
              <button onClick={() => handleExportSelect('html')} className="topbar-dropdown-item">
                HTML (.html)
              </button>
              <button onClick={() => handleExportSelect('pdf')} className="topbar-dropdown-item">
                PDF / Print
              </button>
              <button onClick={() => handleExportSelect('rtf')} className="topbar-dropdown-item">
                Rich Text (.rtf)
              </button>
              <button onClick={() => handleExportSelect('docx')} className="topbar-dropdown-item">
                Word (.docx)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
