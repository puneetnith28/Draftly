'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDraftlyEngine } from '@/hooks/useDraftlyEngine';
import { useEngineNavigation } from '@/hooks/useEngineNavigation';
import { useEngineActiveDocument } from '@/hooks/useEngineActiveDocument';
import { usePreferences } from '@/hooks/usePreferences';
import { Editor } from '@/components/Editor/Editor';
import { TopBar } from '@/components/TopBar';
import { ExportModal } from '@/components/modals/ExportModal';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { PreferencesModal } from '@/components/modals/PreferencesModal';
import { InstallPwaButton } from '@/components/InstallPwaButton';
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/serviceWorkerRegistration';
import { Sidebar } from '@/components/Sidebar';

export default function NotesApp() {
  const engine = useDraftlyEngine();
  const { folders } = useEngineNavigation();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const activeDocument = useEngineActiveDocument(activeDocId);
  const openDocument = useCallback((id: string) => setActiveDocId(id), []);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    engine.documents.getAllDocuments().then((docs) => {
      if (!mounted) return;
      if (docs.length > 0) {
        setActiveDocId(docs[0].id);
      } else {
        engine.documents.createDocument('Untitled', null).then((newDoc) => {
          if (mounted) setActiveDocId(newDoc.id);
        });
      }
      setIsLoaded(true);
    });
    return () => { mounted = false; };
  }, [engine]);

  const {
    preferences,
    isLoaded: prefsLoaded,
    updatePreferences,
    contentWidthPx,
    fontCss,
  } = usePreferences();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
      return;
    }

    void unregisterServiceWorker();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

        const handleExportDoc = useCallback(() => {
    setExportOpen(true);
  }, []);

    const handleSidebarExport = useCallback(
    (id: string) => {
      openDocument(id);
      setExportOpen(true);
    },
    [openDocument]
  );

  if (!isLoaded || !prefsLoaded) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        background: 'var(--bg-app)',
      }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobileViewport}
        activeDocId={activeDocId}
        onClose={() => setSidebarOpen(false)}
        onOpen={openDocument}
        onCreateFolder={(parentId?: string | null) => {
          setEditingFolderId(null);
          setParentFolderId(parentId ?? null);
          setNewFolderOpen(true);
        }}
        onEditFolder={(id: string) => {
          setEditingFolderId(id);
          setNewFolderOpen(true);
        }}
        onExport={handleSidebarExport}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar
          activeDocId={activeDocId}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          isSidebarOpen={sidebarOpen}
          onExport={handleExportDoc}
          onPreferences={() => setPrefsOpen(true)}
        />

        {activeDocument && (
          <Editor
            docId={activeDocument.id}
            content={activeDocument.content}
            contentWidth={contentWidthPx}
            fontCss={fontCss}
            sidebarOffset={!isMobileViewport && sidebarOpen ? 300 : 0}
          />
        )}
      </div>

      <ExportModal
        isOpen={exportOpen}
        document={activeDocument}
        onClose={() => setExportOpen(false)}
      />

      <NewFolderModal
        isOpen={newFolderOpen}
        mode={editingFolderId ? 'edit' : 'create'}
        initialName={editingFolderId ? (folders.find((item) => item.id === editingFolderId)?.name ?? '') : ''}
        initialColor={editingFolderId ? (folders.find((item) => item.id === editingFolderId)?.color ?? undefined) : undefined}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={(name, color) => {
          if (editingFolderId) {
            const folder = folders.find(f => f.id === editingFolderId);
            if (folder) {
              // Create a clone to safely pass to the engine without mutating React state directly
              const updatedFolder = Object.assign(Object.create(Object.getPrototypeOf(folder)), folder);
              updatedFolder.name = name;
              updatedFolder.color = color;
              engine.folders.updateFolder(updatedFolder);
            }
          } else {
            engine.folders.createFolder(name, color, parentFolderId);
          }
          setNewFolderOpen(false);
        }}
        onDelete={editingFolderId ? () => {
          const folder = folders.find((item) => item.id === editingFolderId);
          if (!folder) return;
          const confirmed = window.confirm(
            `Delete folder "${folder.name}"? Documents and subfolders in it will move to its parent level.`
          );
          if (!confirmed) return;
          engine.folders.deleteFolder(editingFolderId);
          setNewFolderOpen(false);
        } : undefined}
      />

      <PreferencesModal
        isOpen={prefsOpen}
        preferences={preferences}
        onClose={() => setPrefsOpen(false)}
        onUpdate={updatePreferences}
      />

      <InstallPwaButton />
    </div>
  );
}
