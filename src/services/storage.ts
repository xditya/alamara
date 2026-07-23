/**
 * Local, on-device persistence for Alamara.
 *
 * The vault index (documents + tickets) is held in the SQLCipher-encrypted store
 * behind `services/sqlite` (unlocked with the Keystore-held master key), and each
 * captured page (image/PDF) is copied out of its temporary picker location into a
 * permanent `blobs/` directory under the app's document directory. Nothing here
 * touches the network — everything stays on the phone.
 *
 * Blob file handling uses the classic (legacy) expo-file-system functional API.
 * Page blobs themselves are not yet encrypted at rest — they sit in app-private
 * storage — so AES-GCM blob encryption is still an open item. Neither change would
 * alter the `db` surface that feature code consumes.
 */

import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  documentDirectory,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  readDirectoryAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { kvGet, kvSet } from '@/services/sqlite';
import type { DocPage, Document, Ticket } from '@/types/models';

export interface VaultData {
  documents: Document[];
  tickets: Ticket[];
}

const ROOT = documentDirectory ?? '';
const BLOBS_DIR = `${ROOT}blobs/`;
const INDEX_FILE = `${ROOT}vault-index.json`; // legacy plaintext index (migrated away)
const VAULT_KEY = 'vault';

async function ensureBlobsDir(): Promise<void> {
  const info = await getInfoAsync(BLOBS_DIR);
  if (!info.exists) await makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
}

export async function readVault(): Promise<VaultData> {
  // Encrypted store (SQLCipher) is the source of truth.
  try {
    const raw = await kvGet(VAULT_KEY);
    if (raw != null) {
      const parsed = JSON.parse(raw) as Partial<VaultData>;
      return { documents: parsed.documents ?? [], tickets: parsed.tickets ?? [] };
    }
  } catch {
    // fall through to migration / empty
  }
  // One-time migration: fold a legacy plaintext JSON index into the encrypted DB,
  // then delete the plaintext copy.
  try {
    const info = await getInfoAsync(INDEX_FILE);
    if (info.exists) {
      const parsed = JSON.parse(await readAsStringAsync(INDEX_FILE)) as Partial<VaultData>;
      const data = { documents: parsed.documents ?? [], tickets: parsed.tickets ?? [] };
      await kvSet(VAULT_KEY, JSON.stringify(data));
      await deleteAsync(INDEX_FILE, { idempotent: true });
      return data;
    }
  } catch {
    // ignore — start clean
  }
  return { documents: [], tickets: [] };
}

export async function writeVault(data: VaultData): Promise<void> {
  await kvSet(VAULT_KEY, JSON.stringify(data));
}

/** File extension (with dot) derived from a URI, defaulting to `.jpg`. */
function extOf(uri: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot) : '';
  return /^\.[a-zA-Z0-9]{1,5}$/.test(ext) ? ext : '.jpg';
}

/**
 * Copies a picked file (a temporary picker/camera URI) into permanent storage and
 * returns the new persistent `file://` URI to store on the document.
 */
export async function persistBlob(srcUri: string, id: string): Promise<string> {
  await ensureBlobsDir();
  const dest = `${BLOBS_DIR}${id}${extOf(srcUri)}`;
  const info = await getInfoAsync(dest);
  if (info.exists) await deleteAsync(dest, { idempotent: true });
  await copyAsync({ from: srcUri, to: dest });
  return dest;
}

/** Best-effort deletion of a document's blob files. */
export async function deleteBlobs(uris: string[]): Promise<void> {
  for (const uri of uris) {
    if (!uri) continue;
    try {
      await deleteAsync(uri, { idempotent: true });
    } catch {
      // already gone — ignore
    }
  }
}

export interface StorageUsage {
  /** Bytes used by the vault index + all page blobs. */
  used: number;
  /** Free bytes on the device. */
  free: number;
  /** Total device capacity in bytes. */
  total: number;
  /** Number of stored blob files. */
  blobCount: number;
}

/** Real on-device usage: sum of the index file and every blob, plus device totals. */
export async function getStorageUsage(): Promise<StorageUsage> {
  let used = 0;
  let blobCount = 0;
  try {
    const raw = await kvGet(VAULT_KEY);
    if (raw) used += raw.length;
  } catch {
    // ignore
  }
  try {
    const dir = await getInfoAsync(BLOBS_DIR);
    if (dir.exists) {
      const names = await readDirectoryAsync(BLOBS_DIR);
      for (const name of names) {
        const info = await getInfoAsync(`${BLOBS_DIR}${name}`);
        if (info.exists && info.size) {
          used += info.size;
          blobCount += 1;
        }
      }
    }
  } catch {
    // ignore
  }
  const [free, total] = await Promise.all([
    getFreeDiskStorageAsync().catch(() => 0),
    getTotalDiskCapacityAsync().catch(() => 0),
  ]);
  return { used, free, total, blobCount };
}

/** Total bytes currently held in the cache directory (decoded previews, temp files). */
export async function getCacheSize(): Promise<number> {
  const cache = cacheDirectory;
  if (!cache) return 0;
  let total = 0;
  try {
    const names = await readDirectoryAsync(cache);
    for (const name of names) {
      const info = await getInfoAsync(`${cache}${name}`);
      if (info.exists && info.size) total += info.size;
    }
  } catch {
    // ignore
  }
  return total;
}

/** Clears cached previews/temp files. The vault (documents + blobs) is untouched. */
export async function clearCache(): Promise<void> {
  const cache = cacheDirectory;
  if (!cache) return;
  try {
    const names = await readDirectoryAsync(cache);
    for (const name of names) {
      try {
        await deleteAsync(`${cache}${name}`, { idempotent: true });
      } catch {
        // in-use file — skip
      }
    }
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ backup */

/**
 * Backup format. A page's `uri` is deliberately NOT part of it: absolute sandbox
 * paths are meaningless on another device (or after a reinstall), so the bytes
 * themselves travel inside the file as base64 and are written back to a fresh
 * blob on import. `format`/`version` let a future reader detect the shape.
 */
export const BACKUP_FORMAT = 'alamara.backup';
export const BACKUP_VERSION = 1;

/** A page as it travels in a backup: metadata plus the embedded image bytes. */
export interface BackupPage extends Omit<DocPage, 'uri'> {
  /** Base64 file contents. Absent when the source file was missing/unreadable. */
  data?: string;
  /** Extension of the original file, including the dot (e.g. `.jpg`). */
  ext?: string;
  mime?: string;
}

export interface BackupDocument extends Omit<Document, 'pages'> {
  pages: BackupPage[];
}

export interface VaultBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  documents: BackupDocument[];
  tickets: Ticket[];
}

export interface ExportResult {
  /** URI of the written backup file (in the cache directory, ready to share). */
  uri: string;
  /** Size of the backup file in bytes. */
  bytes: number;
  documents: number;
  tickets: number;
  /** Pages whose image bytes made it into the file. */
  pages: number;
  /** Pages whose file was missing/unreadable and were exported without bytes. */
  skippedPages: number;
}

export interface ImportResult {
  documents: number;
  tickets: number;
  /** Page images written back to disk. */
  pages: number;
  /** True when the file was a pre-v1 backup, i.e. metadata only. */
  legacy: boolean;
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.pdf': 'application/pdf',
};

function mimeOf(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] ?? 'application/octet-stream';
}

/** Page fields that survive a round-trip, listed explicitly so no stale `uri` leaks in. */
function pageMeta(page: BackupPage | DocPage): Omit<DocPage, 'uri'> {
  return { id: page.id, side: page.side, width: page.width, height: page.height };
}

/** Writes base64 bytes into the blobs directory and returns the new local URI. */
export async function persistBase64(data: string, id: string, ext: string): Promise<string> {
  await ensureBlobsDir();
  const dest = `${BLOBS_DIR}${id}${/^\.[a-zA-Z0-9]{1,5}$/.test(ext) ? ext : '.jpg'}`;
  await deleteAsync(dest, { idempotent: true });
  await writeAsStringAsync(dest, data, { encoding: 'base64' });
  return dest;
}

/**
 * Writes the whole vault — metadata *and* page images — to a single shareable
 * file so a restore on a fresh install reproduces the documents intact.
 *
 * A page whose file has gone missing is exported without its bytes rather than
 * failing the export: losing one image beats losing the entire backup.
 * `onProgress` fires per page so the UI can show movement on large vaults.
 */
export async function exportVault(
  onProgress?: (done: number, total: number) => void,
): Promise<ExportResult> {
  const data = await readVault();
  const total = data.documents.reduce((n, d) => n + d.pages.length, 0);
  let done = 0;
  let pages = 0;
  let skippedPages = 0;

  const documents: BackupDocument[] = [];
  for (const doc of data.documents) {
    const backupPages: BackupPage[] = [];
    for (const page of doc.pages) {
      let embedded: BackupPage = pageMeta(page);
      if (page.uri) {
        try {
          const info = await getInfoAsync(page.uri);
          if (info.exists && !info.isDirectory) {
            const ext = extOf(page.uri);
            embedded = {
              ...embedded,
              data: await readAsStringAsync(page.uri, { encoding: 'base64' }),
              ext,
              mime: mimeOf(ext),
            };
          }
        } catch {
          // unreadable file — keep the page, drop its bytes
        }
      }
      if (embedded.data) pages += 1;
      else skippedPages += 1;
      backupPages.push(embedded);
      onProgress?.(++done, total);
    }
    documents.push({ ...doc, pages: backupPages });
  }

  const payload: VaultBackup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    documents,
    tickets: data.tickets,
  };
  // Base64 already inflates this ~33%; skip pretty-printing to save the rest.
  const dest = `${cacheDirectory ?? ROOT}alamara-backup.json`;
  await deleteAsync(dest, { idempotent: true });
  await writeAsStringAsync(dest, JSON.stringify(payload));
  const info = await getInfoAsync(dest);

  return {
    uri: dest,
    bytes: info.exists && info.size ? info.size : 0,
    documents: documents.length,
    tickets: data.tickets.length,
    pages,
    skippedPages,
  };
}

function isBackupEnvelope(value: unknown): value is VaultBackup {
  return !!value && typeof value === 'object' && (value as VaultBackup).format === BACKUP_FORMAT;
}

/**
 * Merges a backup file into the vault (new ids only — nothing on the device is
 * ever overwritten) and returns how much was added.
 *
 * URIs inside a backup are never trusted: every embedded page is written out as
 * a brand-new blob here and the document points at that. Pre-v1 backups carry
 * bare sandbox paths that cannot exist on this install, so their pages are
 * blanked — the UI then shows the category placeholder instead of a dead image.
 */
export async function importVault(uri: string): Promise<ImportResult> {
  const parsed: unknown = JSON.parse(await readAsStringAsync(uri));
  const legacy = !isBackupEnvelope(parsed);
  // A hand-edited or truncated file can be anything at all — treat missing or
  // non-array sections as empty instead of throwing halfway through a merge.
  const incoming = (parsed && typeof parsed === 'object' ? parsed : {}) as Partial<VaultBackup>;
  const inDocs = Array.isArray(incoming.documents) ? incoming.documents : [];
  const inTickets = Array.isArray(incoming.tickets) ? incoming.tickets : [];

  const current = await readVault();
  const docIds = new Set(current.documents.map((d) => d.id));
  const ticketIds = new Set(current.tickets.map((t) => t.id));
  const candidates = inDocs.filter((d) => d && d.id && !docIds.has(d.id));
  const newTickets = inTickets.filter((t) => t && t.id && !ticketIds.has(t.id));

  let pages = 0;
  const newDocs: Document[] = [];
  for (const doc of candidates) {
    const restored: DocPage[] = [];
    const list = Array.isArray(doc.pages) ? doc.pages : [];
    for (let i = 0; i < list.length; i++) {
      const page = list[i];
      if (!page) continue;
      let restoredUri = '';
      if (!legacy && page.data) {
        try {
          // Fresh filename per restore so an import can never clobber an
          // existing blob that happens to share the document id.
          restoredUri = await persistBase64(
            page.data,
            `${doc.id}-${i}-${Date.now()}`,
            page.ext ?? '.jpg',
          );
          pages += 1;
        } catch {
          restoredUri = ''; // write failed — placeholder beats a dangling path
        }
      }
      restored.push({ ...pageMeta(page), uri: restoredUri });
    }
    newDocs.push({ ...doc, pages: restored });
  }

  if (newDocs.length || newTickets.length) {
    await writeVault({
      documents: [...current.documents, ...newDocs],
      tickets: [...current.tickets, ...newTickets],
    });
  }
  return { documents: newDocs.length, tickets: newTickets.length, pages, legacy };
}
