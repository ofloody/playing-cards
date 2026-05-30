import type { CardId, Rank, Suit } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function cardId(suit: Suit, rank: Rank): CardId {
  return `${suit}-${rank}`;
}

export function parseCard(id: CardId): { suit: Suit; rank: Rank } {
  const idx = id.indexOf('-');
  return { suit: id.slice(0, idx) as Suit, rank: id.slice(idx + 1) as Rank };
}

export function standardDeck(): CardId[] {
  const out: CardId[] = [];
  for (const s of SUITS) for (const r of RANKS) out.push(cardId(s, r));
  return out;
}

export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function isRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}
