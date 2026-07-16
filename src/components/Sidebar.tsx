'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Document, DocumentFolder } from '@shared/types';
import { formatRelativeTime } from '@shared/utils/formatters';
import { useEngineNavigation } from '../hooks/useEngineNavigation';
import { useDraftlyEngine } from '../hooks/useDraftlyEngine';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  activeDocId: string | null;
  onClose: () => void;
  onOpen: (id: string) => void;
  onCreateFolder: (parentFolderId: string | null) => void;
  onEditFolder: (id: string) => void;
  onExport: (id: string) => void;
}

type DragItem = {
  kind: 'folder' | 'document';
  id: string;
  parentId?: string | null;
  folderId?: string | null;
};

type DropTarget = {
  type: 'inside-folder' | 'before-item' | 'after-item';
  targetId: string | null;
  targetKind: 'folder' | 'document';
};

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconFilePlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  );
}

function IconFolderPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l2 3h8a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l2 3h8a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconGrDocumentImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function getPreviewLines(content: string): string[] {
  const rawLines = content.split(/\r?\n/);
  const lines: string[] = [];

  for (const rawLine of rawLines) {
    const cleaned = rawLine
      .replace(/```.*$/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~\-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;
    lines.push(cleaned);
    if (lines.length === 3) break;
  }

  return lines.length > 0 ? lines : ['No content yet.'];
}

function getFileSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}


function getListItemSurface(isDragging: boolean, isLast: boolean): React.CSSProperties {
  return {
    borderRadius: 0,
    border: 'none',
    borderBottom: isLast ? 'none' : '1px solid var(--border-default)',
    background: 'transparent',
    boxShadow: 'none',
    opacity: isDragging ? 0.55 : 1,
    transition: 'opacity 0.12s ease',
  };
}

function DocumentCard({
  doc,
  isActive,
  isDragging,
  isLast,
  onOpen,
  onDelete,
  onExport,
  onDragStart,
  onDragEnd,
}: {
  doc: Document;
  isActive: boolean;
  isDragging: boolean;
  isLast: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, doc: Document) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, doc)}
      onDragEnd={onDragEnd}
      style={{
        ...getListItemSurface(isDragging, isLast),
        padding: '12px 0px ',
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
        <button
          onClick={() => onOpen(doc.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {doc.title || 'Untitled'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
            {getPreviewLines(doc.content).slice(0, 3).map((line, index) => (
              <p
                key={`${index}-${line}`}
                style={{
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-ui)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {line}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            <span>Last edited {formatRelativeTime(doc.updatedAt)}</span>
            <span>{getFileSize(doc.content)}</span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onExport(doc.id); }}
            title="Export"
            style={tinyBtnStyle}
          >
            <IconDownload />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete "${doc.title || 'Untitled'}"?`)) {
                onDelete(doc.id);
              }
            }}
            title="Delete"
            style={tinyBtnStyle}
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  isOpen,
  isMobile,
  activeDocId,
  onClose,
  onOpen,
  onCreateFolder,
  onEditFolder,
  onExport,
}: SidebarProps) {
  const engine = useDraftlyEngine();
  const { documents, folders } = useEngineNavigation();

  const onCreate = (folderId?: string | null) => {
    engine.documents.createDocument('Untitled', folderId || null).then(doc => onOpen(doc.id));
  };
  
  const onDelete = (id: string) => {
    engine.documents.deleteDocument(id);
  };
  
  const onReorderFolders = (folderId: string, targetParentId: string | null, beforeFolderId: string | null) => {};
  const onReorderDocuments = (docId: string, targetFolderId: string | null, beforeDocId?: string | null) => {};

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const orderedFolders = useMemo(
    () => [...folders].sort((a, b) => a.sortOrder - b.sortOrder),
    [folders]
  );

  const orderedDocuments = useMemo(
    () => [...documents].sort((a, b) => a.sortOrder - b.sortOrder),
    [documents]
  );

  const clearDrag = () => setDragItem(null);
  const clearDropTarget = () => setDropTarget(null);

  const handleFolderDragStart = (event: React.DragEvent<HTMLDivElement>, folderId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', folderId);
    const folder = folders.find((f) => f.id === folderId);
    setDragItem({ kind: 'folder', id: folderId, parentId: folder?.parentId ?? null });
  };

  const handleDocumentDragStart = (event: React.DragEvent<HTMLDivElement>, doc: Document) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', doc.id);
    setDragItem({ kind: 'document', id: doc.id, folderId: doc.folderId });
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, id: string, kind: 'folder' | 'document') => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem) return;

    if (dragItem.id === id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    if (kind === 'folder') {
      if (relativeY < rect.height * 0.25) {
        setDropTarget({ type: 'before-item', targetId: id, targetKind: 'folder' });
      } else if (relativeY > rect.height * 0.75) {
        setDropTarget({ type: 'after-item', targetId: id, targetKind: 'folder' });
      } else {
        if (dragItem.kind === 'folder') {
          let isDescendant = false;
          let tempParentId: string | null = id;
          while (tempParentId !== null) {
            if (tempParentId === dragItem.id) {
              isDescendant = true;
              break;
            }
            const parentF = folders.find((f) => f.id === tempParentId);
            tempParentId = parentF ? parentF.parentId : null;
          }
          if (isDescendant) return;
        }
        setDropTarget({ type: 'inside-folder', targetId: id, targetKind: 'folder' });
      }
    } else {
      if (relativeY < rect.height * 0.5) {
        setDropTarget({ type: 'before-item', targetId: id, targetKind: 'document' });
      } else {
        setDropTarget({ type: 'after-item', targetId: id, targetKind: 'document' });
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: string | null, targetKind: 'folder' | 'document' | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem) return;

    const currentDropTarget = dropTarget;
    clearDrag();
    clearDropTarget();

    if (targetKind === 'root') {
      if (dragItem.kind === 'folder') {
        onReorderFolders(dragItem.id, null, null);
      } else {
        onReorderDocuments(dragItem.id, null, null);
      }
      return;
    }

    if (!currentDropTarget) return;

    if (currentDropTarget.type === 'inside-folder') {
      if (dragItem.kind === 'folder') {
        onReorderFolders(dragItem.id, targetId, null);
      } else {
        onReorderDocuments(dragItem.id, targetId, null);
      }
    } else {
      const isBefore = currentDropTarget.type === 'before-item';

      if (dragItem.kind === 'folder') {
        if (currentDropTarget.targetKind === 'folder') {
          const targetFolder = folders.find((f) => f.id === targetId);
          if (targetFolder) {
            const parentId = targetFolder.parentId;
            let beforeId: string | null = null;
            if (isBefore) {
              beforeId = targetFolder.id;
            } else {
              const siblings = folders.filter((f) => f.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
              const targetIdx = siblings.findIndex((f) => f.id === targetId);
              beforeId = siblings[targetIdx + 1]?.id ?? null;
            }
            onReorderFolders(dragItem.id, parentId, beforeId);
          }
        }
      } else {
        if (currentDropTarget.targetKind === 'document') {
          const targetDoc = documents.find((d) => d.id === targetId);
          if (targetDoc) {
            const folderId = targetDoc.folderId;
            let beforeId: string | null = null;
            if (isBefore) {
              beforeId = targetDoc.id;
            } else {
              const siblings = documents.filter((d) => d.folderId === folderId).sort((a, b) => a.sortOrder - b.sortOrder);
              const targetIdx = siblings.findIndex((d) => d.id === targetId);
              beforeId = siblings[targetIdx + 1]?.id ?? null;
            }
            onReorderDocuments(dragItem.id, folderId, beforeId);
          }
        } else if (currentDropTarget.targetKind === 'folder') {
          const targetFolder = folders.find((f) => f.id === targetId);
          if (targetFolder) {
            onReorderDocuments(dragItem.id, targetFolder.parentId, null);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const renderFolderTree = (parentId: string | null, depth: number) => {
    const childFolders = orderedFolders.filter((f) => f.parentId === parentId);
    const childDocs = orderedDocuments.filter((d) => d.folderId === parentId);

    if (childFolders.length === 0 && childDocs.length === 0) {
      if (parentId !== null && expandedFolders[parentId]) {
        return (
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            paddingLeft: `${24 + depth * 8}px`,
            margin: '4px 0',
            fontStyle: 'italic'
          }}>
            Empty folder
          </p>
        );
      }
      return null;
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: depth > 0 ? '1px dashed var(--border-default)' : 'none',
        marginLeft: depth > 0 ? `${10 + (depth - 1) * 2}px` : '0px',
        paddingLeft: depth > 0 ? '8px' : '0px',
      }}>
        {childFolders.map((folder) => {
          const isExpanded = !!expandedFolders[folder.id];
          const isTargeted = dropTarget?.targetId === folder.id;
          const isTargetedInside = isTargeted && dropTarget.type === 'inside-folder';
          const isTargetedBefore = isTargeted && dropTarget.type === 'before-item';
          const isTargetedAfter = isTargeted && dropTarget.type === 'after-item';

          return (
            <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {isTargetedBefore && <div style={dropMarkerStyle} />}
              <div
                draggable
                onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                onDragEnd={() => { clearDrag(); clearDropTarget(); }}
                onDragOver={(e) => handleDragOver(e, folder.id, 'folder')}
                onDrop={(e) => handleDrop(e, folder.id, 'folder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'grab',
                  background: isTargetedInside
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : 'transparent',
                  border: isTargetedInside ? '1px dashed var(--accent)' : '1px solid transparent',
                  opacity: dragItem?.kind === 'folder' && dragItem.id === folder.id ? 0.45 : 1,
                  transition: 'background 0.15s ease',
                  margin: '1px 0',
                }}
                className="sidebar-tree-row"
              >
                <div
                  onClick={() => {
                    setExpandedFolders((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                  </span>
                  <span style={{ color: folder.color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <IconFolder />
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-ui)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {folder.name}
                  </span>
                </div>

                <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => onCreate(folder.id)}
                    title="New document in folder"
                    style={tinyBtnStyle}
                  >
                    <IconPlus />
                  </button>
                  <button
                    onClick={() => onCreateFolder(folder.id)}
                    title="New folder in folder"
                    style={tinyBtnStyle}
                  >
                    <IconFolderPlus />
                  </button>
                  <button
                    onClick={() => onEditFolder(folder.id)}
                    title="Edit folder"
                    style={tinyBtnStyle}
                  >
                    <IconEdit />
                  </button>
                </div>
              </div>
              {isTargetedAfter && <div style={dropMarkerStyle} />}
              {isExpanded && renderFolderTree(folder.id, depth + 1)}
            </div>
          );
        })}

        {childDocs.map((doc) => {
          const isActive = doc.id === activeDocId;
          const isTargeted = dropTarget?.targetId === doc.id;
          const isTargetedBefore = isTargeted && dropTarget.type === 'before-item';
          const isTargetedAfter = isTargeted && dropTarget.type === 'after-item';

          return (
            <div key={doc.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {isTargetedBefore && <div style={dropMarkerStyle} />}
              <div
                draggable
                onDragStart={(e) => handleDocumentDragStart(e, doc)}
                onDragEnd={() => { clearDrag(); clearDropTarget(); }}
                onDragOver={(e) => handleDragOver(e, doc.id, 'document')}
                onDrop={(e) => handleDrop(e, doc.id, 'document')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  paddingLeft: '14px',
                  borderRadius: '6px',
                  cursor: 'grab',
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                    : 'transparent',
                  border: isActive ? '1px solid color-mix(in srgb, var(--accent) 24%, transparent)' : '1px solid transparent',
                  opacity: dragItem?.kind === 'document' && dragItem.id === doc.id ? 0.45 : 1,
                  transition: 'background 0.15s ease',
                  margin: '1px 0',
                }}
                className="sidebar-tree-row"
              >
                <div
                  onClick={() => onOpen(doc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <IconGrDocumentImage />
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-ui)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {doc.title || 'Untitled'}
                  </span>
                </div>

                <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExport(doc.id); }}
                    title="Export"
                    style={tinyBtnStyle}
                  >
                    <IconDownload />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${doc.title || 'Untitled'}"?`)) {
                        onDelete(doc.id);
                      }
                    }}
                    title="Delete"
                    style={tinyBtnStyle}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
              {isTargetedAfter && <div style={dropMarkerStyle} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      aria-hidden={!isOpen}
      style={{
        display: 'flex',
        minHeight: 0,
        position: isMobile ? 'fixed' : 'relative',
        inset: isMobile ? '0' : undefined,
        zIndex: isMobile ? 90 : 'auto',
        pointerEvents: isMobile && !isOpen ? 'none' : 'auto',
      }}
    >
      <style>{`
        .sidebar-tree-row .row-actions {
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .sidebar-tree-row:hover .row-actions {
          opacity: 1;
        }
      `}</style>
      {isMobile && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            border: 'none',
            background: 'rgba(0,0,0,0.24)',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: isOpen ? 'auto' : 'none',
            cursor: 'default',
          }}
        />
      )}

      <div
        style={{
          width: isMobile ? '300px' : (isOpen ? '300px' : '0px'),
          minWidth: isMobile ? '300px' : (isOpen ? '300px' : '0px'),
          maxWidth: isMobile ? 'calc(100vw - 32px)' : undefined,
          height: isMobile ? '100dvh' : undefined,
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-104%)') : 'none',
          opacity: isMobile ? 1 : (isOpen ? 1 : 0),
          overflow: 'hidden',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile
            ? 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'width 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.16s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
          position: isMobile ? 'relative' : 'static',
          zIndex: isMobile ? 1 : 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            minHeight: '50px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
            <IconGrDocumentImage /> Draftly
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => onCreate(null)} title="New document" style={headerBtnStyle}>
              <IconFilePlus />
            </button>
            <button onClick={() => onCreateFolder(null)} title="New folder" style={headerBtnStyle}>
              <IconFolderPlus />
            </button>
            {isMobile && (
              <button onClick={onClose} title="Close sidebar" style={headerBtnStyle}>
                <IconClose />
              </button>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => handleDrop(e, null, 'root')}
          style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}
        >
          {renderFolderTree(null, 0)}
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border-default)',
            background: 'color-mix(in srgb, var(--bg-sidebar) 88%, var(--bg-modal) 12%)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            lineHeight: '1.45',
            textAlign: 'center',
          }}
        >
          Draftly, built with ❤️ by @puneetnith28.<br/>
        </div>
      </div>
    </aside>
  );
}

const headerBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  borderRadius: '7px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'all 0.12s',
};

const tinyBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'all 0.12s',
};

const dropMarkerStyle: React.CSSProperties = {
  height: '10px',
  borderRadius: '999px',
  margin: '2px 0',
  background: 'color-mix(in srgb, var(--accent) 26%, transparent)',
  border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
};
