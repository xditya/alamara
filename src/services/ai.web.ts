/**
 * Web fallback for on-device AI. react-native-executorch is native-only, and on
 * web Alamara is a degraded shell, so semantic search is unavailable here (search
 * falls back to keyword matching). Metro resolves this instead of `ai.ts` on web.
 */

import type { Document } from '@/types/models';

export function isEmbedderReady(): boolean {
  return false;
}

export async function loadEmbedder(_onProgress?: (progress: number) => void): Promise<void> {
  throw new Error('On-device AI is not available on web');
}

export async function isModelDownloaded(): Promise<boolean> {
  return false;
}

export async function warmUpEmbedder(): Promise<boolean> {
  return false;
}

export function clearEmbeddingCache(): void {
  // no-op
}

export async function semanticSearch(_query: string, _docs: Document[], _limit = 20): Promise<Document[]> {
  return [];
}
