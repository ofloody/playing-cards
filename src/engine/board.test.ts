import { test, expect } from 'bun:test';
import { placeAll, cardsInZone, topOf, move, moveToBottom, flip, swap } from './board';

test('placeAll puts cards in a zone in order, all one facing', () => {
  const b = placeAll(['S-A', 'S-2', 'S-3'], 'deck', false);
  expect(cardsInZone(b, 'deck')).toEqual(['S-A', 'S-2', 'S-3']);
  expect(b.faceUp['S-A']).toBe(false);
});

test('topOf returns the last-placed cards', () => {
  const b = placeAll(['S-A', 'S-2', 'S-3'], 'deck', false);
  expect(topOf(b, 'deck')).toEqual(['S-3']);
  expect(topOf(b, 'deck', 2)).toEqual(['S-2', 'S-3']);
});

test('move relocates cards, appends to target, can change facing', () => {
  const b = placeAll(['S-A', 'S-2'], 'deck', false);
  const next = move(b, ['S-A'], 'play', { faceUp: true });
  expect(cardsInZone(next, 'deck')).toEqual(['S-2']);
  expect(cardsInZone(next, 'play')).toEqual(['S-A']);
  expect(next.faceUp['S-A']).toBe(true);
});

test('actions are immutable', () => {
  const b = placeAll(['S-A'], 'deck', false);
  const next = move(b, ['S-A'], 'play', { faceUp: true });
  expect(cardsInZone(b, 'deck')).toEqual(['S-A']); // original unchanged
  expect(next).not.toBe(b);
});

test('moveToBottom places cards beneath the existing pile', () => {
  let b = placeAll(['S-2', 'S-3'], 'stock', false); // S-2 bottom, S-3 top
  b = moveToBottom(b, ['H-9'], 'stock', { faceUp: false });
  // sorted bottom -> top: the new card leads
  expect(cardsInZone(b, 'stock')).toEqual(['H-9', 'S-2', 'S-3']);
  // the original top is unchanged
  expect(topOf(b, 'stock')).toEqual(['S-3']);
});

test('flip toggles facing without moving', () => {
  const b = placeAll(['S-A'], 'play', false);
  const next = flip(b, ['S-A'], true);
  expect(next.faceUp['S-A']).toBe(true);
  expect(cardsInZone(next, 'play')).toEqual(['S-A']);
});

test('swap exchanges the exact placements of two cards', () => {
  let b = placeAll(['S-A', 'S-2'], 'layout', false);
  b = move(b, ['H-9'], 'drawn', { faceUp: true });
  const next = swap(b, 'H-9', 'S-2');
  expect(next.placement['H-9']).toEqual({ zone: 'layout', order: 1 }); // exact slot
  expect(next.placement['S-2']).toEqual({ zone: 'drawn', order: 0 });
  // facing travels with each card, untouched
  expect(next.faceUp['H-9']).toBe(true);
  expect(next.faceUp['S-2']).toBe(false);
});

test('swap within one zone exchanges orders', () => {
  const b = placeAll(['S-A', 'S-2'], 'layout', false);
  const next = swap(b, 'S-A', 'S-2');
  expect(cardsInZone(next, 'layout')).toEqual(['S-2', 'S-A']);
});

test('swap is immutable', () => {
  const b = placeAll(['S-A', 'S-2'], 'layout', false);
  const next = swap(b, 'S-A', 'S-2');
  expect(cardsInZone(b, 'layout')).toEqual(['S-A', 'S-2']); // original unchanged
  expect(next).not.toBe(b);
});
