/**
 * BarcodeView — a DECORATIVE stand-in for a scannable code.
 *
 * QR tickets render a GENUINELY scannable code via react-native-qrcode-svg. The
 * rarer linear/2D formats (code128 / pdf417 / aztec) have no pure-JS encoder, so
 * they fall back to a deterministic pattern derived from hashing `value` — the same
 * value always yields the same picture, so it *looks* like a real, stable code.
 */

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';

type Format = 'qr' | 'code128' | 'pdf417' | 'aztec';

/**
 * A scannable code must stay dark-on-light in BOTH themes — so these two fixed
 * colors are the one deliberate exception to the semantic-token / no-raw-hex rule.
 * The surrounding card supplies the themed chrome.
 */
const PAPER = '#FFFFFF';
const INK = '#14151A';

const GRID = 21; // modules per side (classic QR v1 footprint)
const CELL = 8; // px per module -> 168px matrix
const BAR_AREA = 176; // total width of the linear/stacked bar field

// --- deterministic hash + PRNG (FNV-1a + mulberry32) ---------------------------
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- 2D module matrix (qr / aztec) --------------------------------------------
function placeFinder(m: boolean[][], top: number, left: number) {
  // 7x7 finder pattern + a 1-module quiet separator around it.
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const y = top + r;
      const x = left + c;
      if (y < 0 || x < 0 || y >= GRID || x >= GRID) continue;
      if (r < 0 || r > 6 || c < 0 || c > 6) {
        m[y][x] = false; // separator
        continue;
      }
      const border = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[y][x] = border || core;
    }
  }
}

function buildMatrix(value: string, format: 'qr' | 'aztec'): boolean[][] {
  const rng = mulberry32(hashString(value));
  const m = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => rng() > 0.5));

  if (format === 'qr') {
    placeFinder(m, 0, 0);
    placeFinder(m, 0, GRID - 7);
    placeFinder(m, GRID - 7, 0);
  } else {
    // Aztec: a concentric "bullseye" core, random data outside it.
    const c = (GRID - 1) / 2;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const d = Math.max(Math.abs(y - c), Math.abs(x - c));
        if (d <= 5) m[y][x] = d % 2 === 0;
      }
    }
  }
  return m;
}

// --- linear / stacked bars (code128 / pdf417) ----------------------------------
type Bar = { w: number; on: boolean };

function buildBars(seed: number): Bar[] {
  const rng = mulberry32(seed);
  const bars: Bar[] = [];
  let used = 0;
  let on = true;
  while (used < BAR_AREA) {
    const w = Math.min((1 + Math.floor(rng() * 4)) * 2, BAR_AREA - used); // 2..8px
    bars.push({ w, on });
    used += w;
    on = !on;
  }
  return bars;
}

function buildBarRows(value: string, rows: number): Bar[][] {
  return Array.from({ length: rows }, (_, r) => buildBars(hashString(`${value}:${r}`)));
}

export function BarcodeView({ value, format }: { value: string; format: Format }) {
  // Real, scannable QR — the common ticket case.
  // Real, scannable QR — the common ticket case.
  if (format === 'qr') {
    return (
      <View style={styles.paper} accessibilityRole="image" accessibilityLabel={`QR code for ${value}`}>
        <QRCode value={value} size={184} color={INK} backgroundColor={PAPER} ecl="M" />
        <AppText variant="mono" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      </View>
    );
  }
  return <DecorativeCode value={value} format={format} />;
}

/** Deterministic (non-scannable) placeholder for formats without a pure-JS encoder. */
function DecorativeCode({ value, format }: { value: string; format: Exclude<Format, 'qr'> }) {
  const isGrid = format === 'aztec';

  const matrix = useMemo(() => (isGrid ? buildMatrix(value, 'aztec') : null), [value, isGrid]);
  const barRows = useMemo(
    () => (isGrid ? null : buildBarRows(value, format === 'pdf417' ? 6 : 1)),
    [value, format, isGrid],
  );

  const rowHeight = format === 'pdf417' ? 12 : 96;

  return (
    <View style={styles.paper} accessibilityRole="image" accessibilityLabel={`${format} code for ${value}`}>
      {isGrid ? (
        <View style={styles.grid}>
          {matrix!.map((row, y) => (
            <View key={y} style={styles.row}>
              {row.map((on, x) => (
                <View key={x} style={{ width: CELL, height: CELL, backgroundColor: on ? INK : PAPER }} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.bars}>
          {barRows!.map((bars, r) => (
            <View
              key={r}
              style={[styles.barRow, { height: rowHeight, marginBottom: format === 'pdf417' ? 2 : 0 }]}
            >
              {bars.map((b, i) => (
                <View key={i} style={{ width: b.w, alignSelf: 'stretch', backgroundColor: b.on ? INK : PAPER }} />
              ))}
            </View>
          ))}
        </View>
      )}

      <AppText variant="mono" numberOfLines={1} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: PAPER,
    borderRadius: Radius.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    gap: Spacing.md,
    alignSelf: 'center',
  },
  grid: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  bars: { width: BAR_AREA, alignItems: 'stretch' },
  barRow: { flexDirection: 'row', overflow: 'hidden', width: BAR_AREA },
  value: {
    color: INK,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: BAR_AREA + Spacing.xl,
  },
});
