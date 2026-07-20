/**
 * Data access. MOCK implementation (in-memory) for now — later replaced by op-sqlite
 * (SQLCipher + FTS5) behind this same interface. Feature code must only use these functions.
 */

import { DOCUMENTS, TICKETS } from '@/mock/fixtures';
import type { DocCategory, Document, Ticket } from '@/types/models';

let documents: Document[] = [...DOCUMENTS];
const tickets: Ticket[] = [...TICKETS];

const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export function listDocuments(opts?: { category?: DocCategory }): Promise<Document[]> {
  const list = opts?.category ? documents.filter((d) => d.category === opts.category) : documents;
  return delay([...list].sort((a, b) => b.updatedAt - a.updatedAt));
}

export function getDocument(id: string): Promise<Document | null> {
  return delay(documents.find((d) => d.id === id) ?? null);
}

export function listTickets(): Promise<Ticket[]> {
  return delay([...tickets]);
}

export function getTicket(id: string): Promise<Ticket | null> {
  return delay(tickets.find((t) => t.id === id) ?? null);
}

export function searchDocuments(query: string): Promise<Document[]> {
  const q = query.trim().toLowerCase();
  if (!q) return delay<Document[]>([]);
  return delay(
    documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.fields.some((f) => f.value.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)),
    ),
  );
}

export function saveDocument(doc: Document): Promise<Document> {
  const i = documents.findIndex((d) => d.id === doc.id);
  if (i >= 0) documents[i] = doc;
  else documents = [doc, ...documents];
  return delay(doc);
}

export function deleteDocument(id: string): Promise<boolean> {
  documents = documents.filter((d) => d.id !== id);
  return delay(true);
}
