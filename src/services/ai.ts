/**
 * On-device semantic search via react-native-executorch text embeddings
 * (all-MiniLM-L6-v2, XNNPACK). The model is downloaded once and runs locally —
 * nothing leaves the device. Documents are embedded lazily and cached in memory;
 * a query is embedded and ranked by cosine similarity.
 */

import { models, TextEmbeddingsModule } from 'react-native-executorch';

import type { Document } from '@/types/models';

let modulePromise: Promise<TextEmbeddingsModule> | null = null;
let ready = false;

export function isEmbedderReady(): boolean {
  return ready;
}

/** Downloads (first run) and loads the embedding model. Safe to call repeatedly. */
export async function loadEmbedder(onProgress?: (progress: number) => void): Promise<void> {
  if (!modulePromise) {
    modulePromise = TextEmbeddingsModule.fromModelName(models.text_embedding.all_minilm_l6_v2(), onProgress)
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
