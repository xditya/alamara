import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { documents, loading, refresh };
}

export function useDocument(id: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [id]);

  return { document, loading };
}
