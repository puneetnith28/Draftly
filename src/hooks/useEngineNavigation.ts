import { useState, useEffect, useCallback } from 'react';
import { useDraftlyEngine } from './useDraftlyEngine';
import { Document } from '@shared/types';
import { DocumentFolder } from '@shared/types';

export function useEngineNavigation() {
  const engine = useDraftlyEngine();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNavigation = useCallback(async () => {
    try {
      const [docs, flds] = await Promise.all([
        engine.documents.getAllDocuments(),
        engine.folders.getAllFolders(),
      ]);
      setDocuments(docs);
      setFolders(flds);
    } catch (error) {
      console.error('Failed to fetch navigation data', error);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  useEffect(() => {
    fetchNavigation();

    engine.events.subscribe('DOCUMENT_CREATED', fetchNavigation);
    engine.events.subscribe('DOCUMENT_UPDATED', fetchNavigation);
    engine.events.subscribe('DOCUMENT_DELETED', fetchNavigation);
    engine.events.subscribe('FOLDER_CREATED', fetchNavigation);
    engine.events.subscribe('FOLDER_UPDATED', fetchNavigation);
    engine.events.subscribe('FOLDER_DELETED', fetchNavigation);

    return () => {
      engine.events.unsubscribe('DOCUMENT_CREATED', fetchNavigation);
      engine.events.unsubscribe('DOCUMENT_UPDATED', fetchNavigation);
      engine.events.unsubscribe('DOCUMENT_DELETED', fetchNavigation);
      engine.events.unsubscribe('FOLDER_CREATED', fetchNavigation);
      engine.events.unsubscribe('FOLDER_UPDATED', fetchNavigation);
      engine.events.unsubscribe('FOLDER_DELETED', fetchNavigation);
    };
  }, [engine, fetchNavigation]);

  return {
    documents,
    folders,
    isLoading,
  };
}
