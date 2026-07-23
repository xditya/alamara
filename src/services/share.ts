/**
 * Sharing a document out of the vault.
 *
 * Two things the OS share sheet gets wrong unless we do the work here:
 *  1. `expo-sharing` has no "filename" option — the receiving app shows whatever
 *     the file on disk is called. Page blobs are named `<docId>-0`, so every share
 *     must be staged into the cache directory under `<name>_Alamara.<ext>` first.
 *  2. `expo-sharing.shareAsync()` takes exactly ONE uri, so it cannot hand over a
 *     multi-page document as images at all. `react-native-share` wraps Android's
 *     ACTION_SEND_MULTIPLE and accepts `urls: string[]`, so that is what file
 *     shares go through — with expo-sharing kept as a single-file fallback.
 *  3. A caption alongside attachments is best-effort: it is passed as the share
 *     message, but plenty of targets (WhatsApp among them) drop EXTRA_TEXT when
 *     files are attached. The "shared from Alamara" line therefore also lives
 *     *inside* the PDF, which no receiving app can strip.
 */

import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  makeDirectoryAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import type { DocPage, Document } from '@/types/models';

/** Kept short and factual — it goes into every PDF we hand out. */
export const PROMO_LINE = 'Shared from Alamara · alamara.xditya.me';

const STAGE_DIR = `${cacheDirectory ?? ''}share/`;

/**
 * `expo-print` is loaded lazily, on purpose. It is a native module, so importing it at
 * module scope throws `Cannot find native module 'ExpoPrint'` on any build made before
 * the dependency was added — and that throw happens while this file is being evaluated,
 * which takes the entire document screen down with it ("missing the required default
 * export"). Required at call time, a stale build costs you the PDF option and nothing else.
 */
type PrintModule = { printToFileAsync(options: { html: string }): Promise<{ uri: string }> };

function loadPrint(): PrintModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferring the load IS the fix
    return require('expo-print') as PrintModule;
  } catch {
    throw new Error('PDF export needs a new dev build — rerun `npx expo run:android`');
  }
}

/** Multi-file share sheet. Loaded lazily for the same reason as expo-print above. */
type ShareSheet = {
  open(options: { urls?: string[]; message?: string; title?: string; failOnCancel?: boolean }): Promise<unknown>;
};

function loadShareSheet(): ShareSheet | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferring the load IS the fix
    const mod = require('react-native-share') as { default?: ShareSheet } & ShareSheet;
    return mod.default ?? mod;
  } catch {
    return null; // stale build — caller degrades to expo-sharing (single file only)
  }
}

const IMAGE_MIME: Record<string, { mime: string; uti: string }> = {
  jpg: { mime: 'image/jpeg', uti: 'public.jpeg' },
  jpeg: { mime: 'image/jpeg', uti: 'public.jpeg' },
  png: { mime: 'image/png', uti: 'public.png' },
  heic: { mime: 'image/heic', uti: 'public.heic' },
  heif: { mime: 'image/heic', uti: 'public.heic' },
  webp: { mime: 'image/webp', uti: 'org.webmproject.webp' },
  pdf: { mime: 'application/pdf', uti: 'com.adobe.pdf' },
};

/** Extension of a file URI, lowercased, without the dot. Defaults to `jpg`. */
function extensionOf(uri: string): string {
  const path = uri.split('?')[0].split('#')[0];
  const dot = path.lastIndexOf('.');
  const ext = dot > -1 ? path.slice(dot + 1).toLowerCase() : '';
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
}

/** Strips everything Android/iOS/Windows filesystems choke on, never returns ''. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\.+|\.+$/g, '')
    .trim();
  return cleaned || 'Document';
}

/** `PAN Card` + `pdf` → `PAN Card_Alamara.pdf`. */
export function shareFileName(docName: string, ext: string): string {
  return `${sanitizeFileName(docName)}_Alamara.${ext}`;
}

/** Page 2 of 3 → `PAN Card_Alamara_2.jpg`; a lone page keeps the unnumbered name. */
export function pageFileName(docName: string, ext: string, index: number, total: number): string {
  const base = sanitizeFileName(docName);
  return total > 1 ? `${base}_Alamara_${index + 1}.${ext}` : `${base}_Alamara.${ext}`;
}

/** Pages that actually hold an image we can render or hand over. */
export function imagePagesOf(document: Document): DocPage[] {
  return document.pages.filter((p) => !!p.uri && extensionOf(p.uri) !== 'pdf');
}

/** Pages backed by any real file (images or already-PDF pages). */
export function filePagesOf(document: Document): DocPage[] {
  return document.pages.filter((p) => !!p.uri);
}

async function ensureStageDir(): Promise<void> {
  await makeDirectoryAsync(STAGE_DIR, { intermediates: true }).catch(() => {});
}

/** Copies a file into the cache under `filename` so the share sheet shows that name. */
async function stage(sourceUri: string, filename: string): Promise<string> {
  await ensureStageDir();
  const to = `${STAGE_DIR}${filename}`;
  await deleteAsync(to, { idempotent: true }); // copyAsync refuses to overwrite
  await copyAsync({ from: sourceUri, to });
  return to;
}

/**
 * Hands one or more files to the OS share sheet. Goes through react-native-share so
 * multi-page documents can be sent as separate images in one go; falls back to
 * expo-sharing (single file) on a build that predates the dependency.
 */
async function shareFiles(uris: string[], mime: string, uti: string, title: string): Promise<void> {
  if (uris.length === 0) throw new Error('Nothing to share');

  const sheet = loadShareSheet();
  if (sheet) {
    // Dismissing the sheet is a normal outcome, not an error worth surfacing.
    await sheet.open({ urls: uris, message: PROMO_LINE, title, failOnCancel: false });
    return;
  }

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uris[0], { mimeType: mime, UTI: uti, dialogTitle: title });
}

/**
 * The PDF renderer will not resolve `file://` sources, so every page is inlined as
 * a base64 data URI. One image per page, scaled to fit rather than cropped.
 */
async function buildPdfHtml(pages: DocPage[]): Promise<string> {
  const blocks: string[] = [];
  for (const page of pages) {
    const ext = extensionOf(page.uri);
    const mime = IMAGE_MIME[ext]?.mime ?? 'image/jpeg';
    const base64 = await readAsStringAsync(page.uri, { encoding: 'base64' });
    blocks.push(
      `<section class="page"><img src="data:${mime};base64,${base64}" /><footer>${PROMO_LINE}</footer></section>`,
    );
  }
  // Hex colours are deliberate here: this is print output, not a themed screen.
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  .page {
    position: relative; box-sizing: border-box;
    height: 100vh; width: 100%; padding: 24px 24px 40px;
    display: flex; align-items: center; justify-content: center;
    page-break-after: always; break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .page img { max-width: 100%; max-height: 100%; object-fit: contain; }
  footer {
    position: absolute; left: 0; right: 0; bottom: 14px;
    text-align: center; font-family: -apple-system, Roboto, Helvetica, sans-serif;
    font-size: 9px; letter-spacing: 0.2px; color: #9a9aa2;
  }
</style></head><body>${blocks.join('')}</body></html>`;
}

/** Renders every image page into a single PDF named after the document, then shares it. */
export async function shareDocumentAsPdf(document: Document): Promise<void> {
  const pages = imagePagesOf(document);
  if (pages.length === 0) throw new Error('This document has no pages to put in a PDF');

  const print = loadPrint(); // before base64-ing every page, so a stale build fails instantly
  const html = await buildPdfHtml(pages);
  const { uri } = await print.printToFileAsync({ html });
  const staged = await stage(uri, shareFileName(document.name, 'pdf'));
  await deleteAsync(uri, { idempotent: true }); // the render temp file is now a duplicate
  await shareFiles([staged], 'application/pdf', 'com.adobe.pdf', `Share ${document.name}`);
}

/** Shares a single page file as-is (image or an already-PDF page), correctly named. */
export async function shareDocumentPage(document: Document, page: DocPage): Promise<void> {
  const ext = extensionOf(page.uri);
  const kind = IMAGE_MIME[ext] ?? { mime: 'image/jpeg', uti: 'public.image' };
  const staged = await stage(page.uri, shareFileName(document.name, ext));
  await shareFiles([staged], kind.mime, kind.uti, `Share ${document.name}`);
}

/**
 * Shares EVERY image page in one go, each file named `<doc>_Alamara_<n>.<ext>`.
 * This is the reason react-native-share is here at all — expo-sharing can only
 * ever hand over a single uri, which is why this used to be "first page only".
 */
export async function shareDocumentImages(document: Document): Promise<void> {
  const pages = imagePagesOf(document);
  if (pages.length === 0) throw new Error('This document has no images to share');

  const staged: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    const ext = extensionOf(pages[i].uri);
    staged.push(await stage(pages[i].uri, pageFileName(document.name, ext, i, pages.length)));
  }

  const kind = IMAGE_MIME[extensionOf(pages[0].uri)] ?? { mime: 'image/jpeg', uti: 'public.image' };
  await shareFiles(staged, kind.mime, kind.uti, `Share ${document.name}`);
}

/** Fallback for details-only documents: the fields as plain text, promo included. */
export async function shareDocumentAsText(document: Document): Promise<void> {
  const text = [
    document.name,
    ...document.fields.map((f) => `${f.label}: ${f.value}`),
    '',
    PROMO_LINE,
  ].join('\n');
  await Share.share({ message: text });
}
