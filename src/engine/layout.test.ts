import { test, expect } from 'bun:test';
import { tableDims, computeTransforms } from './layout';
import { placeAll } from './board';
import type { ZoneDef } from './types';

const zones: ZoneDef[] = [
  { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
  { id: 'play', anchor: { x: 0.5, y: 0.7 }, layout: 'row', gap: 0.1 },
];

const square: ZoneDef[] = [
  { id: 'square', anchor: { x: 0.5, y: 0.5 }, layout: 'grid', gap: 0.012 },
];

test('tableDims derive height and card size from width', () => {
  const d = tableDims(1000);
  expect(d.height).toBeCloseTo(620);
  expect(d.cardW).toBeGreaterThan(0);
  expect(d.cardH).toBeGreaterThan(d.cardW);
});

test('pile cards sit near the zone anchor', () => {
  const b = placeAll(['S-A', 'S-2'], 'deck', false);
  const d = tableDims(1000);
  const t = computeTransforms(b, zones, d);
  expect(t['S-A'].x).toBeCloseTo(500, 0);
  expect(t['S-A'].y).toBeCloseTo(310, -1);
});

test('row cards spread symmetrically around the anchor', () => {
  const b = placeAll(['S-A', 'S-2', 'S-3'], 'play', true);
  const d = tableDims(1000);
  const t = computeTransforms(b, zones, d);
  expect(t['S-A'].x).toBeLessThan(t['S-2'].x);
  expect(t['S-2'].x).toBeLessThan(t['S-3'].x);
  expect(t['S-2'].x).toBeCloseTo(500, 0); // middle card on the anchor
});

test('highlight and spotlight flags propagate', () => {
  const b = placeAll(['S-A', 'S-2'], 'play', true);
  const d = tableDims(1000);
  const t = computeTransforms(b, zones, d, { highlight: ['S-A'], spotlight: ['play'] });
  expect(t['S-A'].highlight).toBe(true);
  expect(t['S-A'].dim).toBe(false);
});

test('grid lays four cards two-by-two around the anchor', () => {
  const b = placeAll(['S-A', 'S-2', 'S-3', 'S-4'], 'square', false);
  const t = computeTransforms(b, square, tableDims(1000));
  expect(t['S-A'].x).toBeCloseTo(t['S-3'].x); // left column lines up
  expect(t['S-2'].x).toBeCloseTo(t['S-4'].x); // right column lines up
  expect(t['S-A'].y).toBeCloseTo(t['S-2'].y); // top row lines up
  expect(t['S-3'].y).toBeCloseTo(t['S-4'].y); // bottom row lines up
  expect((t['S-A'].x + t['S-2'].x) / 2).toBeCloseTo(500, 0); // centred on anchor
  expect(t['S-A'].y).toBeLessThan(t['S-3'].y);
});

test('a fifth grid card opens a third row below', () => {
  const b = placeAll(['S-A', 'S-2', 'S-3', 'S-4', 'S-5'], 'square', false);
  const t = computeTransforms(b, square, tableDims(1000));
  expect(t['S-5'].y).toBeGreaterThan(t['S-4'].y);
  expect(t['S-5'].x).toBeCloseTo(t['S-A'].x); // column 0
});

test('known flags propagate to face-down cards only as flags', () => {
  const b = placeAll(['S-A', 'S-2'], 'deck', false);
  const t = computeTransforms(b, zones, tableDims(1000), { known: ['S-A'] });
  expect(t['S-A'].known).toBe(true);
  expect(t['S-2'].known).toBe(false);
});
