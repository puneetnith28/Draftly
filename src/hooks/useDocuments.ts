import { useState, useEffect } from 'react';
import { Document, DocumentFolder } from '@/types';

const STORAGE_KEY = 'draftly_documents';
const ACTIVE_DOC_KEY = 'draftly_active_doc_id';
const FOLDER_STORAGE_KEY = 'draftly_folders';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedDocs = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_DOC_KEY);
      
      let parsedDocs: Document[] = [];
      if (storedDocs) {
        parsedDocs = JSON.parse(storedDocs);
      }

      const storedFolders = localStorage.getItem(FOLDER_STORAGE_KEY);
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }

      if (parsedDocs.length === 0) {
        const welcomeDoc: Document = {
          id: `doc_${Date.now()}`,
          title: 'Welcome to Draftly',
          content: '# Welcome to Draftly\n\nThis is your first note.',
          folderId: null,
          sortOrder: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        parsedDocs = [welcomeDoc];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedDocs));
      }

      setDocuments(parsedDocs);

      if (storedActiveId && parsedDocs.some(d => d.id === storedActiveId)) {
        setActiveDocId(storedActiveId);
      } else {
        setActiveDocId(parsedDocs[0].id);
        localStorage.setItem(ACTIVE_DOC_KEY, parsedDocs[0].id);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveToStorage = (newDocs: Document[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDocs));
    setDocuments(newDocs);
  };

  const saveFoldersToStorage = (newFolders: DocumentFolder[]) => {
    localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(newFolders));
    setFolders(newFolders);
  };

  const createDocument = (folderId: string | null = null) => {
    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      folderId,
      sortOrder: documents.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...documents, newDoc];
    saveToStorage(updated);
    setActiveDocId(newDoc.id);
    localStorage.setItem(ACTIVE_DOC_KEY, newDoc.id);
  };

  const updateDocument = (id: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>) => {
    const updatedDocs = documents.map((doc) => {
      if (doc.id === id) {
        return {
          ...doc,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return doc;
    });
    saveToStorage(updatedDocs);
  };

  const deleteDocument = (id: string) => {
    const remaining = documents.filter((doc) => doc.id !== id);

    if (activeDocId === id) {
      if (remaining.length > 0) {
        const fallbackId = remaining[remaining.length - 1].id;
        setActiveDocId(fallbackId);
        localStorage.setItem(ACTIVE_DOC_KEY, fallbackId);
      } else {
        const welcomeDoc: Document = {
          id: `doc_${Date.now()}`,
          title: 'Welcome to Draftly',
          content: '# Welcome to Draftly\n\nThis is your first note.',
          folderId: null,
          sortOrder: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        remaining.push(welcomeDoc);
        setActiveDocId(welcomeDoc.id);
        localStorage.setItem(ACTIVE_DOC_KEY, welcomeDoc.id);
      }
    }

    saveToStorage(remaining);
  };

  const duplicateDocument = (id: string) => {
    const target = documents.find((doc) => doc.id === id);
    if (!target) return;

    const duplicated: Document = {
      ...target,
      id: `doc_${Date.now()}`,
      title: `${target.title} (Copy)`,
      sortOrder: documents.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...documents, duplicated];
    saveToStorage(updated);
    setActiveDocId(duplicated.id);
    localStorage.setItem(ACTIVE_DOC_KEY, duplicated.id);
  };

  const createFolder = (name: string, color: string = '#3b82f6') => {
    const newFolder: DocumentFolder = {
      id: `folder_${Date.now()}`,
      name,
      color,
      sortOrder: folders.length,
    };
    const updated = [...folders, newFolder];
    saveFoldersToStorage(updated);
  };

  const renameFolder = (id: string, name: string) => {
    const updated = folders.map((f) => {
      if (f.id === id) {
        return { ...f, name };
      }
    });
    saveFoldersToStorage(updated);
  };

  const deleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    saveFoldersToStorage(updatedFolders);

    const updatedDocs = documents.map((doc) => {
      if (doc.folderId === folderId) {
        return { ...doc, folderId: null };
      }
      return doc;
    });
    saveToStorage(updatedDocs);
  };

  const activeDocument = documents.find(d => d.id === activeDocId) || null;

  return {
    documents,
    folders,
    activeDocId,
    activeDocument,
    isLoaded,
    setActiveDocId: (id: string) => {
      setActiveDocId(id);
      localStorage.setItem(ACTIVE_DOC_KEY, id);
    },
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    createFolder,
    renameFolder,
    deleteFolder,
  };
}
