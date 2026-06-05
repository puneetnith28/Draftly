import { useState, useEffect } from 'react';
import { Document } from '@/types';

const STORAGE_KEY = 'draftly_documents';
const ACTIVE_DOC_KEY = 'draftly_active_doc_id';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
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

  const createDocument = () => {
    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      folderId: null,
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

  const activeDocument = documents.find(d => d.id === activeDocId) || null;

  return {
    documents,
    activeDocId,
    activeDocument,
    isLoaded,
    setActiveDocId: (id: string) => {
      setActiveDocId(id);
      localStorage.setItem(ACTIVE_DOC_KEY, id);
    },
    createDocument,
    updateDocument,
  };
}
