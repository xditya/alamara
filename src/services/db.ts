/**
 * Data access facade. Persists to on-device storage (`services/storage`) — a JSON
 * vault index plus copied page-blob files. Feature code must only use these
 * functions; the storage backend swaps to op-sqlite (SQLCipher + FTS5) during the
 * native build phase without changing this surface.
 */

import * as storage from '@/services/storage';
import type { DocCategory, Document, Ticket } from '@/types/models';

// Storage / backup utilities (thin pass-throughs to the persistence layer).
export const getStorageUsage = storage.getStorageUsage;
export const getCacheSize = storage.getCacheSize;
export const clearCache = storage.clearCache;
export const exportVault = storage.exportVault;
export const importVault = storage.importVault;
export type { StorageUsage } from '@/services/storage';

export function listDocuments(opts?: { category?: DocCategory }): Promise<Document[]> {
  return storage.readVault().then(({ documents }) => {
    const list = opts?.category ? documents.filter((d) => d.category === opts.category) : documents;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  });
}

export function getDocument(id: string): Promise<Document | null> {
  return storage.readVault().then(({ documents }) => documents.find((d) => d.id === id) ?? null);
}

export function listTickets(): Promise<Ticket[]> {
  return storage.readVault().then(({ tickets }) => [...tickets]);
}

export function getTicket(id: string): Promise<Ticket | null> {
  return storage.readVault().then(({ tickets }) => tickets.find((t) => t.id === id) ?? null);
}

export function searchDocuments(query: string): Promise<Document[]> {
  const q = query.trim().toLowerCase();
  if (!q) return Promise.resolve<Document[]>([]);
  return storage.readVault().then(({ documents }) =>
    documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.fields.some((f) => f.value.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)),
    ),
  );
}

/** Copies picked page files into permanent storage, returning persistent URIs. */
export async function persistPages(docId: string, sourceUris: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < sourceUris.length; i++) {
    out.push(await storage.persistBlob(sourceUris[i], `${docId}-${i}`));
  }
  return out;
}

export async function saveDocument(doc: Document): Promise<Document> {
  const data = await storage.readVault();
  const i = data.documents.findIndex((d) => d.id === doc.id);
  if (i >= 0) data.documents[i] = doc;
  else data.documents = [doc, ...data.documents];
  await storage.writeVault(data);
  return doc;
}

export async function saveTicket(ticket: Ticket): Promise<Ticket> {
  const data = await storage.readVault();
  const i = data.tickets.findIndex((t) => t.id === ticket.id);
  if (i >= 0) data.tickets[i] = ticket;
  else data.tickets = [ticket, ...data.tickets];
  await storage.writeVault(data);
  return ticket;
}

/** Removes a tag from every document that carries it. */
export async function removeTagEverywhere(tag: string): Promise<void> {
  const data = await storage.readVault();
  let changed = false;
  for (const doc of data.documents) {
    if (doc.tags.includes(tag)) {
      doc.tags = doc.tags.filter((t) => t !== tag);
      changed = true;
    }
  }
  if (changed) await storage.writeVault(data);
}

/** Renames a tag across every document (merging if the new name already exists). */
export async function renameTagEverywhere(from: string, to: string): Promise<void> {
  const next = to.trim();
  if (!next || next === from) return;
  const data = await storage.readVault();
  let changed = false;
  for (const doc of data.documents) {
    if (doc.tags.includes(from)) {
      const set = new Set(doc.tags.map((t) => (t === from ? next : t)));
      doc.tags = [...set];
      changed = true;
    }
  }
  if (changed) await storage.writeVault(data);
}

/** Removes any Wallet tickets tied to a document (used when its category changes). */
export async function removeTicketsForDocument(docId: string): Promise<void> {
  const data = await storage.readVault();
  const next = data.tickets.filter((t) => t.documentId !== docId);
  if (next.length !== data.tickets.length) {
    data.tickets = next;
    await storage.writeVault(data);
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const data = await storage.readVault();
  const doc = data.documents.find((d) => d.id === id);
  if (doc) await storage.deleteBlobs(doc.pages.map((p) => p.uri));
  data.documents = data.documents.filter((d) => d.id !== id);
  data.tickets = data.tickets.filter((t) => t.documentId !== id);
  await storage.writeVault(data);
  return true;
}
