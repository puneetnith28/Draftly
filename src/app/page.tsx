'use client';

import React, { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { usePreferences } from '@/hooks/usePreferences';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Editor } from '@/components/Editor/Editor';
import { PreferencesModal } from '@/components/modals/PreferencesModal';
import {
  exportToMarkdown,
  exportToHtml,
  exportToPdf,
  exportToRtf,
  exportToDocx,
} from '@/lib/exportUtils';

export default function Home() {
  const {
    documents,
    folders,
    activeDocId,
    activeDocument,
    isLoaded,
    setActiveDocId,
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    createFolder,
    renameFolder,
    deleteFolder,
    moveDocumentToFolder,
  } = useDocuments();

  const { preferences, updatePreference } = usePreferences();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleTitleChange = (id: string, title: string) => {
    updateDocument(id, { title });
  };

  const handleEditorChange = (markdown: string) => {
    if (!activeDocument) return;
    setSavingStatus('saving');
    updateDocument(activeDocument.id, { content: markdown });
    
    setTimeout(() => {
      setSavingStatus('saved');
      setTimeout(() => {
        setSavingStatus('idle');
      }, 1000);
    }, 400);
  };

  const handleExport = (format: 'md' | 'html' | 'pdf' | 'rtf' | 'docx') => {
    if (!activeDocument) return;
    const title = activeDocument.title || 'Untitled';
    const content = activeDocument.content;

    switch (format) {
      case 'md':
        exportToMarkdown(title, content);
        break;
      case 'html':
        exportToHtml(title, content);
        break;
      case 'pdf':
        exportToPdf(title, content);
        break;
      case 'rtf':
        exportToRtf(title, content);
        break;
      case 'docx':
        exportToDocx(title, content);
        break;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f7f6f3] text-[#1a1916] dark:bg-[#141413] dark:text-[#e8e6e1]">
        <div className="text-lg font-medium animate-pulse">Loading Draftly...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        folders={folders}
        documents={documents}
        activeDocumentId={activeDocId}
        onSelectDocument={setActiveDocId}
        onCreateDocument={createDocument}
        onCreateFolder={createFolder}
        onUpdateFolder={(id, updates) => updates.name && renameFolder(id, updates.name)}
        onDeleteFolder={deleteFolder}
        onMoveDocument={moveDocumentToFolder}
      />

      <div className={`main-content ${!sidebarOpen ? 'w-full' : ''}`}>
        <TopBar
          activeDocument={activeDocument}
          onTitleChange={handleTitleChange}
          savingStatus={savingStatus}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenPreferences={() => setPreferencesOpen(true)}
          onExport={handleExport}
        />

        {activeDocument ? (
          <Editor
            key={activeDocument.id}
            initialContent={activeDocument.content}
            onChange={handleEditorChange}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#a09e98]">
            No document selected. Create or select a document in the sidebar.
          </div>
        )}
      </div>

      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        preferences={preferences}
        updatePreference={updatePreference}
      />
    </div>
  );
}
