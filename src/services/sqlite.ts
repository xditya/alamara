/**
 * Encrypted database (op-sqlite + SQLCipher). Holds the vault index as encrypted
 * rows, unlocked with the Keystore-held master key. A simple key/value surface is
 * enough for the current JSON-per-vault model; the schema can grow (normalised
 * tables + FTS5) without changing the `db` facade above it.
 */

import { open, type DB } from '@op-engineering/op-sqlite';

import { getDatabaseKey } from '@/services/secure-key';

let dbPromise: Promise<DB> | null = null;

async function init(): Promise<DB> {
  const key = await getDatabaseKey();
  const db = open({ name: 'alamara.db', encryptionKey: key });
  await db.execute('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL)');
  return db;
}

function getDb(): Promise<DB> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

export async function kvGet(key: string): Promise<string | null> {
  const db = await getDb();
  const res = await db.execute('SELECT v FROM kv WHERE k = ?', [key]);
  const rows = (res.rows ?? []) as { v: string }[];
  return rows.length > 0 ? rows[0].v : null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', [key, value]);
}
