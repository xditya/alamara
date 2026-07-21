import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import * as db from '@/services/db';
import type { DocCategory, Document } from '@/types/models';

export function useDocuments(opts?: { category?: DocCategory }) {
  const category = opts?.category;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    db.listDocuments(category ? { category } : undefined).then((d) => {
      setDocuments(d);
      setLoading(false);
    });
  }, [category]);

  // Re-read on every focus so freshly-saved documents appear when returning to a tab.
  useFocusEffect(refresh);

  return { documents, loading, refresh };
}

export function useDocument(id: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-fetch on focus so edits made in the review flow are reflected on return.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      db.getDocument(id).then((d) => {
        if (mounted) {
          setDocument(d);
          setLoading(false);
        }
      });
      return () => {
        mounted = false;
      };
    }, [id]),
  );

  // Lightweight re-read without toggling the loading state (e.g. after adding a page).
  const refresh = useCallback(() => {
    db.getDocument(id).then(setDocument);
  }, [id]);

  return { document, loading, refresh };
}
