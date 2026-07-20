/** Core domain models shared across every feature. Import, don't redefine. */

import type { DocCategory } from '@/constants/theme';

export type { DocCategory } from '@/constants/theme';

export type DocStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  /** Render with the monospace face (ID numbers). */
  mono?: boolean;
  /** Offer tap-to-copy. */
  copyable?: boolean;
}

export interface DocPage {
  id: string;
  /** File URI of the page image. Empty string = show a category placeholder. */
  uri: string;
  side?: 'front' | 'back';
  width?: number;
  height?: number;
}

export interface Document {
  id: string;
  category: DocCategory;
  name: string;
  suggestedName?: string;
  status: DocStatus;
  pages: DocPage[];
  fields: ExtractedField[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export type TicketStatus = 'upcoming' | 'past' | 'archived';
export type BarcodeFormat = 'qr' | 'code128' | 'pdf417' | 'aztec';

export interface Ticket {
  id: string;
  documentId: string;
  eventTitle: string;
  eventAt: number;
  venue?: string;
  seat?: string;
  barcodeValue: string;
  barcodeFormat: BarcodeFormat;
  status: TicketStatus;
}

export const CATEGORY_LABELS: Record<DocCategory, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  id: 'ID Card',
  ticket: 'Ticket',
  certificate: 'Certificate',
  other: 'Document',
};
