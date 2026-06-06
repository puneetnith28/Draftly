'use client';

import React, { useState } from 'react';
import { Document, DocumentFolder } from '@/types';

interface SidebarProps {
  folders: DocumentFolder[];
  documents: Document[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCreateDocument: (folderId?: string | null) => void;
  onCreateFolder: (name: string, color: string) => void;
  onUpdateFolder: (id: string, updates: Partial<DocumentFolder>) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
];

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  documents,
  activeDocumentId,
  onSelectDocument,
  onCreateDocument,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(COLORS[0]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleStartEditFolder = (folder: DocumentFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveEditFolder = (id: string) => {
    if (editingFolderName.trim()) {
      onUpdateFolder(id, { name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setShowNewFolderForm(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('text/plain', docId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    if (docId) {
      onMoveDocument(docId, targetFolderId);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uncategorizedDocs = filteredDocuments.filter((doc) => doc.folderId === null);

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Draftly</h2>
        <button onClick={() => onCreateDocument(null)} className="sidebar-new-doc-btn">
          + New Note
        </button>
      </div>

      <div className="sidebar-search-container">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Folders</span>
          <button
            onClick={() => setShowNewFolderForm(!showNewFolderForm)}
            className="sidebar-add-folder-btn"
            title="Create Folder"
          >
            +
          </button>
        </div>

        {showNewFolderForm && (
          <form onSubmit={handleCreateFolderSubmit} className="sidebar-new-folder-form">
            <input
              type="text"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="sidebar-folder-input"
              autoFocus
            />
            <div className="sidebar-color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewFolderColor(color)}
                  className={`sidebar-color-dot ${newFolderColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="sidebar-form-actions">
              <button type="submit" className="sidebar-form-submit">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewFolderForm(false)}
                className="sidebar-form-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="sidebar-folders-list">
          {folders.map((folder) => {
            const folderDocs = filteredDocuments.filter((doc) => doc.folderId === folder.id);
            const isExpanded = expandedFolders[folder.id];

            return (
              <div
                key={folder.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={`sidebar-folder-node ${isExpanded ? 'expanded' : ''}`}
              >
                <div onClick={() => toggleFolder(folder.id)} className="sidebar-folder-row">
                  <span className="sidebar-folder-arrow">{isExpanded ? '▼' : '▶'}</span>
                  <span
                    className="sidebar-folder-color-indicator"
                    style={{ backgroundColor: folder.color }}
                  />

                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleSaveEditFolder(folder.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditFolder(folder.id)}
                      className="sidebar-folder-rename-input"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="sidebar-folder-name">{folder.name}</span>
                  )}

                  <div className="sidebar-folder-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleStartEditFolder(folder, e)}
                      className="sidebar-folder-item-btn"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="sidebar-folder-item-btn"
                      title="Delete"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => onCreateDocument(folder.id)}
                      className="sidebar-folder-item-btn"
                      title="Add Note"
                    >
                      +
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="sidebar-folder-documents">
                    {folderDocs.length === 0 ? (
                      <div className="sidebar-empty-state">No documents</div>
                    ) : (
                      folderDocs.map((doc) => (
                        <div
                          key={doc.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, doc.id)}
                          onClick={() => onSelectDocument(doc.id)}
                          className={`sidebar-doc-row ${
                            activeDocumentId === doc.id ? 'active' : ''
                          }`}
                        >
                          <span className="sidebar-doc-icon">📄</span>
                          <span className="sidebar-doc-title">
                            {doc.title || 'Untitled'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
        className="sidebar-section"
      >
        <span className="sidebar-section-title">All Notes</span>
        <div className="sidebar-documents-list">
          {uncategorizedDocs.map((doc) => (
            <div
              key={doc.id}
              draggable
              onDragStart={(e) => handleDragStart(e, doc.id)}
              onClick={() => onSelectDocument(doc.id)}
              className={`sidebar-doc-row ${activeDocumentId === doc.id ? 'active' : ''}`}
            >
              <span className="sidebar-doc-icon">📄</span>
              <span className="sidebar-doc-title">{doc.title || 'Untitled'}</span>
            </div>
          ))}
          {uncategorizedDocs.length === 0 && searchQuery && (
            <div className="sidebar-empty-state">No matches found</div>
          )}
        </div>
      </div>
    </aside>
  );
};
