import { useState, useEffect } from 'react';
import { useDraftlyEngine } from './useDraftlyEngine';
import { DocumentEntity } from '@domain/entities/Document';

export function useEngineActiveDocument(activeDocId: string | null) {
  const engine = useDraftlyEngine();
  const [activeDocument, setActiveDocument] = useState<DocumentEntity | null>(null);

  useEffect(() => {
    if (!activeDocId) {
      setActiveDocument(null);
      return;
    }

    // Load initial state
    engine.documents.getDocument(activeDocId).then((doc) => {
      setActiveDocument(doc);
    });

    // Listen to updates
    const handleUpdate = (payload: { document: DocumentEntity }) => {
      if (payload.document.id === activeDocId) {
        // Clone to force re-render if necessary, or just rely on state diff
        setActiveDocument(Object.assign(Object.create(Object.getPrototypeOf(payload.document)), payload.document));
      }
    };

    engine.events.subscribe('DOCUMENT_UPDATED', handleUpdate);
    engine.events.subscribe('DOCUMENT_CREATED', handleUpdate); // Edge case where creation makes it active immediately

    return () => {
      engine.events.unsubscribe('DOCUMENT_UPDATED', handleUpdate);
      engine.events.unsubscribe('DOCUMENT_CREATED', handleUpdate);
    };
  }, [engine, activeDocId]);

  return activeDocument;
}
