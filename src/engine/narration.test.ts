import { describe, expect, test } from 'bun:test';
import { segmentNarration } from './narration';
import type { ZoneDef } from './types';

const zone = (id: string, label: string, labelColor?: string): ZoneDef => ({
  id,
  anchor: { x: 0.5, y: 0.5 },
  layout: 'grid',
  label,
  labelColor,
});

const SEATS = [
  zone('p-you', 'You', '#ffe14a'),
  zone('p-side', 'Side', '#4ab25b'),
  zone('p-across', 'Across', '#4388f0'),
  zone('p-diagonal', 'Diagonal', '#f04b36'),
];

describe('segmentNarration', () => {
  test('returns the whole text untouched when no zone has a labelColor', () => {
    const plain = [zone('p-1', 'North')];
    expect(segmentNarration('North draws a card.', plain)).toEqual([
      { text: 'North draws a card.' },
    ]);
  });

  test('colours exact label mentions and leaves the rest plain', () => {
    const segs = segmentNarration('Side draws from the stock.', SEATS);
    expect(segs).toEqual([
      { text: 'Side', color: '#4ab25b' },
      { text: ' draws from the stock.' },
    ]);
  });

  test('matches possessives but never lowercase or embedded words', () => {
    const segs = segmentNarration(
      'Across’s square sits across the table, beside you.',
      SEATS,
    );
    expect(segs[0]).toEqual({ text: 'Across', color: '#4388f0' });
    // lowercase "across" and "you" are prose, not names
    expect(segs.slice(1)).toEqual([{ text: '’s square sits across the table, beside you.' }]);
  });

  test('"You" does not claim the start of "Your"', () => {
    const segs = segmentNarration('Your turn. You draw.', SEATS);
    expect(segs).toEqual([
      { text: 'Your turn. ' },
      { text: 'You', color: '#ffe14a' },
      { text: ' draw.' },
    ]);
  });

  test('colours every mention in a multi-name sentence', () => {
    const segs = segmentNarration('Totals: You 4 · Across 15 · Diagonal 17 · Side 31.', SEATS);
    const named = segs.filter((s) => s.color);
    expect(named.map((s) => s.text)).toEqual(['You', 'Across', 'Diagonal', 'Side']);
  });

  test('marks "rank of suit" card phrases with rank, glyph and colour', () => {
    const segs = segmentNarration('You draw a three of diamonds.', SEATS);
    expect(segs).toEqual([
      { text: 'You', color: '#ffe14a' },
      { text: ' draw a ' },
      { text: 'three of diamonds', card: { rank: '3', suit: '♦', red: true } },
      { text: '.' },
    ]);
  });

  test('reads ten as 10, courts as letters, and clubs/spades as black', () => {
    const ten = segmentNarration('a ten of clubs', []);
    expect(ten.at(-1)?.card).toEqual({ rank: '10', suit: '♣', red: false });
    const king = segmentNarration('the king of spades', []);
    expect(king.at(-1)?.card).toEqual({ rank: 'K', suit: '♠', red: false });
  });

  test('detects cards even when no zone carries a colour', () => {
    const segs = segmentNarration('She flips the ace of hearts over.', []);
    expect(segs).toEqual([
      { text: 'She flips the ' },
      { text: 'ace of hearts', card: { rank: 'A', suit: '♥', red: true } },
      { text: ' over.' },
    ]);
  });

  test('catches the literal shorthand form, like "3♣" and "10♥"', () => {
    const segs = segmentNarration('whoever was dealt the 3♣ leads it', []);
    expect(segs).toEqual([
      { text: 'whoever was dealt the ' },
      { text: '3♣', card: { rank: '3', suit: '♣', red: false } },
      { text: ' leads it' },
    ]);
    const ten = segmentNarration('the 10♥ wins', []);
    expect(ten[1].card).toEqual({ rank: '10', suit: '♥', red: true });
  });

  test('leaves bare ranks and counts alone (no suit, no badge)', () => {
    expect(segmentNarration('down to two cards in a two-by-two square', [])).toEqual([
      { text: 'down to two cards in a two-by-two square' },
    ]);
  });
});
