/**
 * Web fallback for the encrypted DB layer. op-sqlite is native-only (its web build
 * pulls in `better-sqlite3`, a Node module), and on web Alamara is a degraded shell,
 * so the vault index lives in localStorage here — no encryption, no native deps.
 * Metro resolves this file instead of `sqlite.ts` on the web platform.
 */

export async function kvGet(key: string): Promise<string | null> {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // storage unavailable — ignore
  }
}
