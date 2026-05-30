import { test, expect } from 'bun:test';
import { war } from './war';
import { runGame } from '../engine/runGame';
import { cardsInZone } from '../engine/board';

test('war reduces to one snapshot per step with no lost cards', () => {
  const snaps = runGame(war);
  expect(snaps.length).toBe(war.steps.length);
  // every snapshot still accounts for all 52 cards
  for (const s of snaps) {
    expect(Object.keys(s.board.placement).length).toBe(52);
  }
});

test('after collect, Player 1 won pile holds the two battle cards', () => {
  const snaps = runGame(war);
  const collect = snaps.find((s) => s.step.id === 'collect')!;
  expect(cardsInZone(collect.board, 'p1-won')).toEqual(['S-A', 'H-9']);
});
