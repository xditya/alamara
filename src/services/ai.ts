/**
 * On-device semantic search via react-native-executorch text embeddings
 * (all-MiniLM-L6-v2, XNNPACK). The model is downloaded once and runs locally —
 * nothing leaves the device. Documents are embedded lazily and cached in memory;
 * a query is embedded and ranked by cosine similarity.
 */

import { initExecutorch, models, TextEmbeddingsModule } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import type { Document } from '@/types/models';

// ExecuTorch needs a resource-fetcher adapter registered before ANY model can be
// downloaded or loaded — without it every load fails with "ResourceFetcher adapter
// is not initialized". The Expo adapter downloads via expo-file-system into the
// app's document directory.
initExecutorch({ resourceFetcher: ExpoResourceFetcher });

const EMBEDDING_MODEL = models.text_embedding.all_minilm_l6_v2();

let modulePromise: Promise<TextEmbeddingsModule> | null = null;
let ready = false;

export function isEmbedderReady(): boolean {
  return ready;
}

/**
 * Mirrors `ResourceFetcherUtils.getFilenameFromUri` in react-native-executorch:
 * drop the scheme, drop the fragment, then replace every character outside
 * [a-zA-Z0-9._-] with an underscore. So the file on disk is the mangled *whole*
 * URL, not just its last path segment.
 *
 * We have to reimplement it because the library exposes no public "is this model
 * already downloaded?" check, and we need one — see `isModelDownloaded`.
 */
function downloadedFilename(uri: string): string {
  return uri
    .replace(/^https?:\/\//, '')
    .split('#')[0]
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * True when the model files are already on disk, so loading needs no network.
 * The fetcher stores them under documentDirectory (not the cache directory), so
 * they survive restarts and OS cache eviction.
 */
export async function isModelDownloaded(): Promise<boolean> {
  try {
    const files = await ExpoResourceFetcher.listDownloadedFiles();
    const present = new Set(files.map((f) => f.split('/').pop() ?? ''));
    return [EMBEDDING_MODEL.modelSource, EMBEDDING_MODEL.tokenizerSource].every((source) =>
      present.has(downloadedFilename(source)),
    );
  } catch {
    // The directory does not exist until the first download.
    return false;
  }
}

/**
 * Loads an already-downloaded model back into memory, and reports whether it
 * could. `ready` and `modulePromise` are module state, so they are lost on every
 * app restart even though the model file is still on disk — without warming up,
 * semantic search silently degrades to keyword-only and the settings screen
 * offers to "download" a model the device already has.
 *
 * Returns false when nothing is downloaded yet, leaving that choice to the user.
 */
export async function warmUpEmbedder(): Promise<boolean> {
  if (ready) return true;
  if (!(await isModelDownloaded())) return false;
  await loadEmbedder();
  return true;
}

/** Downloads (first run) and loads the embedding model. Safe to call repeatedly. */
export async function loadEmbedder(onProgress?: (progress: number) => void): Promise<void> {
  if (!modulePromise) {
    modulePromise = TextEmbeddingsModule.fromModelName(EMBEDDING_MODEL, onProgress)
      .then((m) => {
        ready = true;
        return m;
      })
      .catch((err) => {
        modulePromise = null;
        ready = false;
        throw err;
      });
  }
  await modulePromise;
}

async function embed(text: string): Promise<Float32Array> {
  if (!modulePromise) throw new Error('Embedder not loaded');
  const module = await modulePromise;
  return module.forward(text);
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** The text of a document that gets embedded (name + tags + fields). */
function documentText(doc: Document): string {
  return [doc.name, ...doc.tags, ...doc.fields.map((f) => `${f.label}: ${f.value}`)].join('. ');
}

// Cache embeddings by document id + its updatedAt stamp (recompute when it changes).
const cache = new Map<string, { stamp: number; vec: Float32Array }>();

/** Drops cached document embeddings so they're recomputed on the next search. */
export function clearEmbeddingCache(): void {
  cache.clear();
}

async function embedDocument(doc: Document): Promise<Float32Array> {
  const cached = cache.get(doc.id);
  if (cached && cached.stamp === doc.updatedAt) return cached.vec;
  const vec = await embed(documentText(doc));
  cache.set(doc.id, { stamp: doc.updatedAt, vec });
  return vec;
}

/** Ranks documents by semantic similarity to the query (best first). */
export async function semanticSearch(query: string, docs: Document[], limit = 20): Promise<Document[]> {
  if (!query.trim() || docs.length === 0 || !ready) return [];
  const q = await embed(query);
  const scored: { doc: Document; score: number }[] = [];
  for (const doc of docs) {
    const vec = await embedDocument(doc);
    scored.push({ doc, score: cosineSimilarity(q, vec) });
  }
  return scored
    .filter((s) => s.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.doc);
}
