/**
 * Web fallback for OCR. ML Kit is native-only, and on web Alamara is a degraded
 * shell, so OCR is a no-op here (documents are categorised manually). Metro
 * resolves this instead of `ocr.ts` on web.
 */

export async function recognizeText(_uri: string): Promise<{ text: string }> {
  return { text: '' };
}
