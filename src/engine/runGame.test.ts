import { test, expect } from 'bun:test';
import { runGame } from './runGame';
import { placeAll, move, cardsInZone } from './board';
import type { Game } from './types';

const game: Game = {
  id: 't', title: 'T', blurb: '', players: '2', playTime: '1', difficulty: 'Easy',
  zones: [],
  build: () => placeAll(['S-A', 'S-2'], 'deck', false),
  steps: [
    { id: 's0', title: 'deck', narration: '', apply: (b) => b },
    { id: 's1', title: 'play', narration: '', apply: (b) => move(b, ['S-A'], 'play', { faceUp: true }) },
  ],
};

test('runGame produces one snapshot per step, cumulatively applied', () => {
  const snaps = runGame(game);
  expect(snaps.length).toBe(2);
  expect(cardsInZone(snaps[0].board, 'deck')).toEqual(['S-A', 'S-2']);
  expect(cardsInZone(snaps[1].board, 'play')).toEqual(['S-A']);
  expect(snaps[1].index).toBe(1);
});
