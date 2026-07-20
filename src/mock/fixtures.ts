/** In-memory sample data so the UI is buildable/previewable before the native DB lands. */

import type { Document, Ticket } from '@/types/models';

const now = Date.now();
const DAY = 86_400_000;

export const DOCUMENTS: Document[] = [
  {
    id: 'd1',
    category: 'aadhaar',
    name: 'Aadhaar — Aditya S',
    suggestedName: 'Aadhaar — 1234 5678 9012',
    status: 'ready',
    pages: [{ id: 'd1p1', uri: '', side: 'front' }, { id: 'd1p2', uri: '', side: 'back' }],
    fields: [
      { key: 'number', label: 'Aadhaar Number', value: '1234 5678 9012', mono: true, copyable: true },
      { key: 'name', label: 'Name', value: 'Aditya S', copyable: true },
      { key: 'dob', label: 'Date of Birth', value: '12/08/2003', copyable: true },
    ],
    tags: ['identity', 'government'],
    createdAt: now - 40 * DAY,
    updatedAt: now - 40 * DAY,
  },
  {
    id: 'd2',
    category: 'pan',
    name: 'PAN — ABCDE1234F',
    status: 'ready',
    pages: [{ id: 'd2p1', uri: '' }],
    fields: [
      { key: 'number', label: 'PAN', value: 'ABCDE1234F', mono: true, copyable: true },
      { key: 'name', label: 'Name', value: 'Aditya S', copyable: true },
    ],
    tags: ['identity', 'tax'],
    createdAt: now - 30 * DAY,
    updatedAt: now - 30 * DAY,
  },
  {
    id: 'd3',
    category: 'id',
    name: 'College ID — Aditya S',
    status: 'ready',
    pages: [{ id: 'd3p1', uri: '', side: 'front' }, { id: 'd3p2', uri: '', side: 'back' }],
    fields: [
      { key: 'roll', label: 'Roll No.', value: 'CS21B1042', mono: true, copyable: true },
      { key: 'name', label: 'Name', value: 'Aditya S', copyable: true },
    ],
    tags: ['student'],
    createdAt: now - 12 * DAY,
    updatedAt: now - 12 * DAY,
  },
  {
    id: 'd4',
    category: 'certificate',
    name: 'B.Tech Degree Certificate',
    status: 'ready',
    pages: [{ id: 'd4p1', uri: '' }],
    fields: [{ key: 'univ', label: 'University', value: 'Anna University', copyable: true }],
    tags: ['education'],
    createdAt: now - 8 * DAY,
    updatedAt: now - 8 * DAY,
  },
  {
    id: 'd5',
    category: 'id',
    name: 'Passport — Aditya S',
    status: 'ready',
    pages: [{ id: 'd5p1', uri: '' }],
    fields: [{ key: 'number', label: 'Passport No.', value: 'M1234567', mono: true, copyable: true }],
    tags: ['identity', 'travel'],
    createdAt: now - 300 * DAY,
    updatedAt: now - 300 * DAY,
    expiresAt: now + 25 * DAY,
  },
  {
    id: 'd6',
    category: 'ticket',
    name: 'PVR — Interstellar (Re-release)',
    status: 'ready',
    pages: [{ id: 'd6p1', uri: '' }],
    fields: [
      { key: 'pnr', label: 'Booking ID', value: 'BMS7X9K2', mono: true, copyable: true },
      { key: 'seat', label: 'Seat', value: 'H14, H15', copyable: true },
    ],
    tags: ['movie'],
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * DAY,
  },
];

export const TICKETS: Ticket[] = [
  {
    id: 't1',
    documentId: 'd6',
    eventTitle: 'Interstellar (Re-release)',
    eventAt: now + 3 * DAY,
    venue: 'PVR Nexus, Bengaluru',
    seat: 'H14, H15',
    barcodeValue: 'BMS7X9K2-INTERSTELLAR',
    barcodeFormat: 'qr',
    status: 'upcoming',
  },
  {
    id: 't2',
    documentId: 'd6',
    eventTitle: 'IndiGo 6E-233 · BLR → DEL',
    eventAt: now + 9 * DAY,
    venue: 'Kempegowda Intl (BLR)',
    seat: '14A',
    barcodeValue: 'PNR-QK7T2M-6E233',
    barcodeFormat: 'pdf417',
    status: 'upcoming',
  },
  {
    id: 't3',
    documentId: 'd6',
    eventTitle: 'Coldplay · Music of the Spheres',
    eventAt: now - 20 * DAY,
    venue: 'DY Patil Stadium, Mumbai',
    seat: 'Lounge 3',
    barcodeValue: 'CP-2026-9931',
    barcodeFormat: 'qr',
    status: 'past',
  },
];
