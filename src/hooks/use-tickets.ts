import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import * as db from '@/services/db';
import type { Document, Ticket } from '@/types/models';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    db.listTickets().then((t) => {
      setTickets(t);
      setLoading(false);
    });
  }, []);

  // Re-read on every focus so freshly-saved tickets appear when returning to the tab.
  useFocusEffect(refresh);

  const upcoming = useMemo(
    () => tickets.filter((t) => t.status === 'upcoming').sort((a, b) => a.eventAt - b.eventAt),
    [tickets],
  );
  const past = useMemo(
    () => tickets.filter((t) => t.status !== 'upcoming').sort((a, b) => b.eventAt - a.eventAt),
    [tickets],
  );

  return { upcoming, past, loading, refresh };
}

export function useTicket(id: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    db.getTicket(id).then(async (t) => {
      const doc = t ? await db.getDocument(t.documentId) : null;
      if (mounted) {
        setTicket(t);
        setDocument(doc);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  return { ticket, document, loading };
}
