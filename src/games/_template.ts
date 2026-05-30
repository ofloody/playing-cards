// Copy this file to `src/games/<your-game>.ts`, fill it in, then register it in
// `src/games/index.ts`:
//   import { yourGame } from './your-game';
//   export const games: Game[] = [war, yourGame];
//
// A game is pure data. You describe what the table looks like at each step;
// the engine animates every card from its previous spot to its new one.
import type { Game } from '../engine/types';
import { standardDeck } from '../engine/deck';
import { placeAll, move } from '../engine/board';

const deck = standardDeck();

export const template: Game = {
  id: 'template',
  title: 'My Game',
  blurb: 'One sentence describing the game.',
  players: '2–4',
  playTime: '15 min',
  difficulty: 'Easy',
  // Zones are regions on the felt. anchor is a 0..1 fraction of table size.
  // Opponent zones usually set rotate: 180. Use layout 'pile' | 'row' | 'fan'.
  zones: [
    { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
    { id: 'hand', anchor: { x: 0.5, y: 0.8 }, layout: 'fan', gap: 0.06 },
  ],
  build: () => placeAll(deck, 'deck', false),
  steps: [
    {
      id: 'intro',
      title: 'Step title',
      narration: 'Explain this step in one or two sentences.',
      // apply returns a NEW board. Use move(board, ids, zone, { faceUp }).
      apply: (b) => move(b, ['S-A', 'S-2', 'S-3'], 'hand', { faceUp: true }),
      highlight: ['S-A'], // optional: glow these cards
      spotlight: ['hand'], // optional: dim every other zone
      callout: 'Optional rule tip.',
    },
  ],
};
