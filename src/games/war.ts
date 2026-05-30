import type { Game } from '../engine/types';
import { standardDeck, parseCard } from '../engine/deck';
import { placeAll, move, moveToBottom } from '../engine/board';

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
  origin: `This is a children's game played in many parts of the world. No strategy is involved - simply the ability to recognise which of two cards is higher in rank, and to follow the procedure of the game. The standard two-player game is described first, then the game for three or four players. after this are summaries of some of the many variations, including a version in which captured cards can be stolen, a Russian version of it called Drunkard (P'yanitsa), a German version Tod und Leben., a version from Syria and a gambling version offered in some casinos.`,
  // One packet per player: a stock they draw from. Captured cards return to the
  // bottom of that same stock — there is no separate "won" pile in War.
  zones: [
    { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
    { id: 'p2-stock', anchor: { x: 0.2, y: 0.27 }, layout: 'pile', rotate: 180, label: 'Player 2' },
    { id: 'p2-play', anchor: { x: 0.56, y: 0.34 }, layout: 'row', rotate: 180, gap: 0.07 },
    { id: 'p1-play', anchor: { x: 0.56, y: 0.66 }, layout: 'row', gap: 0.07 },
    { id: 'p1-stock', anchor: { x: 0.2, y: 0.73 }, layout: 'pile', label: 'Player 1' },
  ],
  build: () => placeAll(deck, 'deck', false),
  steps: [
    {
      id: 'deck',
      title: 'A standard deck',
      narration:
        'War uses one standard 52-card deck — shuffle it well. Cards rank as usual, Ace high down to the 2; suits are ignored, so only rank ever matters.',
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
      title: 'Winner takes both — to the bottom',
      narration:
        'The winner immediately slides both cards, face-down, under their own stock — the very pile they draw from. There is no separate won pile in War; captured cards go straight to the bottom and come back around later.',
      apply: (b) => moveToBottom(b, ['S-A', 'H-9'], 'p1-stock', { faceUp: false }),
      highlight: ['S-A', 'H-9'],
      spotlight: ['p1-stock'],
    },
    {
      id: 'tie',
      title: 'A tie means War!',
      narration:
        'When the two flipped cards are equal in rank, it is War. Here both players turn a Five. The tied cards stay on the table and the war begins.',
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
      title: 'One down, one up',
      narration:
        'Each player plays their next card face-down, then a second card face-up. These new face-up cards decide the war. (If they tie again, the war simply continues the same way.)',
      apply: (b) => {
        let n = move(b, ['S-6'], 'p1-play', { faceUp: false });
        n = move(n, ['S-K'], 'p1-play', { faceUp: true });
        n = move(n, ['C-6'], 'p2-play', { faceUp: false });
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
        'The higher new face-up card wins every card in the war — all six this time. The King beats the Three, so Player 1 sweeps the lot straight to the bottom of their stock, face-down.',
      apply: (b) =>
        moveToBottom(
          b,
          ['S-5', 'S-6', 'S-K', 'C-5', 'C-6', 'C-3'],
          'p1-stock',
          { faceUp: false },
        ),
      highlight: ['S-K'],
      spotlight: ['p1-stock'],
    },
    {
      id: 'goal',
      title: 'Play until someone holds all 52',
      narration:
        'Because every captured card goes to the bottom of your own pile, the cards keep cycling. Play continues — battle after battle — until one player has won all 52. That player wins, though it can take a good long while.',
      apply: (b) => b,
      spotlight: ['p1-stock', 'p2-stock'],
    },
  ],
  notes: [
    {
      heading: 'The three-card war',
      body: 'A popular variation lays three cards face-down instead of one — players often chant “W-A-R” as they do — then flip a fourth to decide it. The winner takes all ten cards. Everything else plays the same.',
    },
    {
      heading: 'Running out mid-war',
      body: 'If you can’t complete a war you lose; if neither player can, whoever runs out first loses (and simultaneous is a draw). A common house rule instead: your last card is flipped face-up and stands for the rest of that war.',
    },
    {
      heading: 'Three or four players',
      body: 'Deal as evenly as possible (17 each for three, 13 for four). Highest card wins the turn; on a tie, everyone — not only the tied players — joins the war. Run out of cards and you drop out; the last player holding cards wins.',
    },
    {
      heading: 'Around the world',
      body: 'The same flip-and-compare core powers many variants: stealing captured cards, the Russian Drunkard (P’yanitsa), the German Tod und Leben, a Syrian version, and even a casino gambling version.',
    },
  ],
};
