import { test, expect } from 'bun:test';
import { placeAll, cardsInZone, topOf, move, flip } from './board';

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

test('flip toggles facing without moving', () => {
  const b = placeAll(['S-A'], 'play', false);
  const next = flip(b, ['S-A'], true);
  expect(next.faceUp['S-A']).toBe(true);
  expect(cardsInZone(next, 'play')).toEqual(['S-A']);
});
