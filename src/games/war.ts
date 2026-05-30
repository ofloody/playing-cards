import type { Game } from '../engine/types';
import { standardDeck, parseCard } from '../engine/deck';
import { placeAll, move } from '../engine/board';

const deck = standardDeck();
const p1Cards = deck.filter((id) => ['S', 'D'].includes(parseCard(id).suit)); // incl. S-A
const p2Cards = deck.filter((id) => ['H', 'C'].includes(parseCard(id).suit)); // incl. H-9

export const war: Game = {
  id: 'war',
  title: 'War',
  blurb: 'The classic luck-driven duel. Flip cards, high card wins — until someone holds all 52.',
  players: '2',
  playTime: '10–20 min',
  difficulty: 'Easy',
  accent: '#b3433a',
  zones: [
    { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
    { id: 'p2-stock', anchor: { x: 0.18, y: 0.18 }, layout: 'pile', rotate: 180, label: 'Player 2' },
    { id: 'p2-play', anchor: { x: 0.5, y: 0.32 }, layout: 'row', rotate: 180, gap: 0.07 },
    { id: 'p2-won', anchor: { x: 0.82, y: 0.18 }, layout: 'pile', rotate: 180 },
    { id: 'p1-stock', anchor: { x: 0.18, y: 0.82 }, layout: 'pile', label: 'Player 1' },
    { id: 'p1-play', anchor: { x: 0.5, y: 0.68 }, layout: 'row', gap: 0.07 },
    { id: 'p1-won', anchor: { x: 0.82, y: 0.82 }, layout: 'pile' },
  ],
  build: () => placeAll(deck, 'deck', false),
  steps: [
    {
      id: 'deck',
      title: 'A standard deck',
      narration:
        'War uses one standard 52-card deck. Shuffle it well — War is a game of pure luck, with no decisions to make.',
      apply: (b) => b,
      spotlight: ['deck'],
    },
    {
      id: 'deal',
      title: 'Deal it all out',
      narration:
        'Deal the entire deck out face-down, one card at a time, until each player has a face-down stock of 26 cards. Players never look at their cards.',
      apply: (b) => {
        let n = move(b, p1Cards, 'p1-stock', { faceUp: false });
        n = move(n, p2Cards, 'p2-stock', { faceUp: false });
        return n;
      },
      spotlight: ['p1-stock', 'p2-stock'],
    },
    {
      id: 'flip',
      title: 'Battle: flip the top card',
      narration:
        'Each round, both players flip their top card face-up into the middle at the same time. Here Player 1 turns the Ace of Spades; Player 2 turns the Nine of Hearts.',
      apply: (b) => {
        let n = move(b, ['S-A'], 'p1-play', { faceUp: true });
        n = move(n, ['H-9'], 'p2-play', { faceUp: true });
        return n;
      },
      highlight: ['S-A', 'H-9'],
      spotlight: ['p1-play', 'p2-play'],
    },
    {
      id: 'compare',
      title: 'High card wins',
      narration:
        'Compare ranks. Aces are high, twos are low; suits never matter. The Ace beats the Nine, so Player 1 wins the battle.',
      callout: 'Rank order, low → high: 2 3 4 5 6 7 8 9 10 J Q K A.',
      apply: (b) => b,
      highlight: ['S-A'],
      spotlight: ['p1-play', 'p2-play'],
    },
    {
      id: 'collect',
      title: 'Winner takes both',
      narration:
        'The winner takes both battle cards and adds them face-down to the bottom of their won pile. Those cards will be played again later.',
      apply: (b) => move(b, ['S-A', 'H-9'], 'p1-won', { faceUp: false }),
      spotlight: ['p1-won'],
    },
    {
      id: 'tie',
      title: 'A tie means War!',
      narration:
        'When both flipped cards share the same rank, it is War. Here both players turn a Five — neither wins outright.',
      apply: (b) => {
        let n = move(b, ['S-5'], 'p1-play', { faceUp: true });
        n = move(n, ['C-5'], 'p2-play', { faceUp: true });
        return n;
      },
      highlight: ['S-5', 'C-5'],
      spotlight: ['p1-play', 'p2-play'],
    },
    {
      id: 'war',
      title: 'Three down, one up',
      narration:
        'Each player lays three more cards face-down, then flips a fourth face-up. These new face-up cards decide the War.',
      apply: (b) => {
        let n = move(b, ['S-6', 'S-7', 'S-8'], 'p1-play', { faceUp: false });
        n = move(n, ['S-K'], 'p1-play', { faceUp: true });
        n = move(n, ['C-6', 'C-7', 'C-8'], 'p2-play', { faceUp: false });
        n = move(n, ['C-3'], 'p2-play', { faceUp: true });
        return n;
      },
      highlight: ['S-K', 'C-3'],
      spotlight: ['p1-play', 'p2-play'],
    },
    {
      id: 'war-win',
      title: 'Winner sweeps the pile',
      narration:
        'The higher face-up card wins every card on the table — all ten this time. The King beats the Three, so Player 1 sweeps the War.',
      apply: (b) =>
        move(
          b,
          ['S-5', 'S-6', 'S-7', 'S-8', 'S-K', 'C-5', 'C-6', 'C-7', 'C-8', 'C-3'],
          'p1-won',
          { faceUp: false },
        ),
      highlight: ['S-K'],
      spotlight: ['p1-won'],
    },
    {
      id: 'goal',
      title: 'Play until someone holds all 52',
      narration:
        'Players keep flipping until one player has won every card. When a player runs out, they shuffle their won pile into a new stock and play on. The last player standing wins.',
      apply: (b) => b,
      spotlight: ['p1-stock', 'p1-won'],
    },
  ],
};
