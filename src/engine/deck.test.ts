import { test, expect } from 'bun:test';
import { standardDeck, parseCard, cardId, RANK_VALUE, isRed } from './deck';

test('standardDeck has 52 unique cards', () => {
  const deck = standardDeck();
  expect(deck.length).toBe(52);
  expect(new Set(deck).size).toBe(52);
});

test('parseCard round-trips cardId', () => {
  expect(parseCard(cardId('S', 'A'))).toEqual({ suit: 'S', rank: 'A' });
  expect(parseCard('H-10')).toEqual({ suit: 'H', rank: '10' });
});

test('ace is high, two is low', () => {
  expect(RANK_VALUE['A']).toBeGreaterThan(RANK_VALUE['K']);
  expect(RANK_VALUE['2']).toBe(2);
});

test('hearts and diamonds are red', () => {
  expect(isRed('H')).toBe(true);
  expect(isRed('D')).toBe(true);
  expect(isRed('S')).toBe(false);
});
