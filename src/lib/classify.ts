/**
 * Deterministic document classification + field extraction (Tier 1 of the AI plan).
 * Pure regex/keyword logic — no native, no model. Runs on OCR text.
 */

import { CATEGORY_LABELS, type DocCategory, type ExtractedField } from '@/types/models';

export function classify(text: string): { category: DocCategory; confidence: number } {
  const t = text.toLowerCase();
  if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text) || t.includes('aadhaar') || t.includes('uidai') || text.includes('आधार')) {
    return { category: 'aadhaar', confidence: 0.92 };
  }
  if (/[A-Z]{5}[0-9]{4}[A-Z]/.test(text) || t.includes('permanent account number') || t.includes('income tax')) {
    return { category: 'pan', confidence: 0.9 };
  }
  if (t.includes('pnr') || t.includes('boarding') || t.includes('seat') || t.includes('show time')) {
    return { category: 'ticket', confidence: 0.72 };
  }
  if (t.includes('certificate') || t.includes('degree') || t.includes('university')) {
    return { category: 'certificate', confidence: 0.7 };
  }
  if (t.includes('employee id') || t.includes('student id') || t.includes('identity card')) {
    return { category: 'id', confidence: 0.6 };
  }
  return { category: 'other', confidence: 0.3 };
}

export function extractFields(text: string, category: DocCategory): ExtractedField[] {
  const fields: ExtractedField[] = [];

  if (category === 'aadhaar') {
    const m = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
    if (m) fields.push({ key: 'number', label: 'Aadhaar Number', value: m[1].trim(), mono: true, copyable: true });
  }
  if (category === 'pan') {
    const m = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (m) fields.push({ key: 'number', label: 'PAN', value: m[0], mono: true, copyable: true });
  }

  const dob = text.match(/\b(\d{2}[/\-]\d{2}[/\-]\d{4})\b/);
  if (dob) fields.push({ key: 'date', label: 'Date', value: dob[1], copyable: true });

  return fields;
}

export function suggestName(category: DocCategory, fields: ExtractedField[]): string {
  const num = fields.find((f) => f.key === 'number')?.value;
  return num ? `${CATEGORY_LABELS[category]} — ${num}` : CATEGORY_LABELS[category];
}
