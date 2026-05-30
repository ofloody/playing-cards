import { test, expect } from 'bun:test';
import { tableDims, computeTransforms } from './layout';
import { placeAll } from './board';
import type { ZoneDef } from './types';

const zones: ZoneDef[] = [
  { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
  { id: 'play', anchor: { x: 0.5, y: 0.7 }, layout: 'row', gap: 0.1 },
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
