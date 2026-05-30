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

test('the basic war is one-down-one-up: six cards change hands', () => {
  const snaps = runGame(war);
  const beforeWar = snaps.find((s) => s.step.id === 'war')!;
  const afterWar = snaps.find((s) => s.step.id === 'war-win')!;
  // 6 cards are on the table across both play zones before the sweep
  const onTable =
    cardsInZone(beforeWar.board, 'p1-play').length +
    cardsInZone(beforeWar.board, 'p2-play').length;
  expect(onTable).toBe(6);
  // after the sweep both play zones are empty and the 6 war cards joined p1-won
  expect(cardsInZone(afterWar.board, 'p1-play')).toEqual([]);
  expect(cardsInZone(afterWar.board, 'p2-play')).toEqual([]);
  for (const id of ['S-5', 'S-6', 'S-K', 'C-5', 'C-6', 'C-3']) {
    expect(afterWar.board.placement[id].zone).toBe('p1-won');
  }
});
