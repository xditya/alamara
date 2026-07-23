/**
 * Web fallback. Both notifee and expo-live-activity are native-only, and the
 * web build is a degraded shell, so download progress stays in-app there.
 * Metro resolves this instead of `download-progress.ts` on web.
 */

export async function beginDownloadProgress(): Promise<void> {
  // no-op
}

export async function updateDownloadProgress(_fraction: number): Promise<void> {
  // no-op
}

export async function endDownloadProgress(_outcome: 'done' | 'failed'): Promise<void> {
  // no-op
}
