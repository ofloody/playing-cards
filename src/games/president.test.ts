import { test, expect } from 'bun:test';
import { president } from './president';
import { runGame } from '../engine/runGame';
import { cardsInZone } from '../engine/board';

test('president reduces to one snapshot per step with all 52 cards', () => {
  const snaps = runGame(president);
  expect(snaps.length).toBe(president.steps.length);
  for (const s of snaps) {
    expect(Object.keys(s.board.placement).length).toBe(52);
  }
});

test('the deal gives every seat thirteen cards', () => {
  const snaps = runGame(president);
  const deal = snaps.find((s) => s.step.id === 'deal')!;
  for (const seat of ['p-south', 'p-west', 'p-north', 'p-east']) {
    expect(cardsInZone(deal.board, seat).length).toBe(13);
  }
});

test('round 1: you win with a king and clear the pile', () => {
  const snaps = runGame(president);
  const king = snaps.find((s) => s.step.id === 'r1-king')!;
  expect(cardsInZone(king.board, 'trick')).toContain('S-K');
  const cleared = snaps.find((s) => s.step.id === 'r1-clear')!;
  expect(cardsInZone(cleared.board, 'trick')).toEqual([]);
});

test('round 2: completing four aces (a revolution) puts all four on the table and shakes', () => {
  const snaps = runGame(president);
  const rev = snaps.find((s) => s.step.id === 'r2-revolution')!;
  for (const ace of ['D-A', 'S-A', 'H-A', 'C-A']) {
    expect(cardsInZone(rev.board, 'trick')).toContain(ace);
  }
  expect(rev.step.impact).toBe(true);
});

test('round 3: the single-2 bomb lands on the jacks and shakes', () => {
  const snaps = runGame(president);
  const bomb = snaps.find((s) => s.step.id === 'r3-bomb')!;
  const trick = cardsInZone(bomb.board, 'trick');
  expect(trick).toContain('S-2');
  expect(trick).toContain('H-J'); // sits on the pair of jacks
  expect(bomb.step.impact).toBe(true);
});

test('endgame: you go out first, and West is left holding exactly one card — a 2', () => {
  const snaps = runGame(president);
  const out = snaps.find((s) => s.step.id === 'out-president')!;
  expect(cardsInZone(out.board, 'p-south')).toEqual([]); // President, out first
  expect(out.step.stagger).toContain('trick'); // the going-out plays in sequence

  const almost = snaps.find((s) => s.step.id === 'west-almost')!;
  expect(cardsInZone(almost.board, 'p-west')).toEqual(['H-2']); // down to a single card
  expect(almost.board.faceUp['H-2']).toBe(true); // revealed as the doomed 2
});

test('endgame: West’s 2 detonates the instant they are down to it', () => {
  const snaps = runGame(president);
  const almost = snaps.find((s) => s.step.id === 'west-almost')!;
  expect(cardsInZone(almost.board, 'p-west')).toEqual(['H-2']); // down to the lone 2
  expect(almost.board.faceUp['H-2']).toBe(true); // revealed as it goes off
  expect(almost.step.impact).toBe(true); // the bomb shakes the table right here
});

test('endgame: West is the Bum despite being ahead; everyone else is out', () => {
  const snaps = runGame(president);
  const settled = snaps.find((s) => s.step.id === 'east-vbum')!;
  expect(cardsInZone(settled.board, 'p-north')).toEqual([]); // Vice-President, out
  expect(cardsInZone(settled.board, 'p-east')).toEqual([]); // Vice-Bum, out
  expect(cardsInZone(settled.board, 'p-west')).toEqual(['H-2']); // left holding the 2 -> Bum
});

test('the next deal hands everyone thirteen fresh cards again', () => {
  const snaps = runGame(president);
  const nd = snaps.find((s) => s.step.id === 'next-deal')!;
  for (const seat of ['p-south', 'p-west', 'p-north', 'p-east']) {
    expect(cardsInZone(nd.board, seat).length).toBe(13);
  }
});

test('the trade sends two cards up the ladder to the President and one to the V.P.', () => {
  const snaps = runGame(president);
  const ex = snaps.find((s) => s.step.id === 'exchange')!;
  // Bum → President: the two highest cards.
  expect(ex.board.placement['H-2'].zone).toBe('p-south');
  expect(ex.board.placement['H-A'].zone).toBe('p-south');
  // President → Bum: two cards back.
  expect(ex.board.placement['S-3'].zone).toBe('p-west');
  expect(ex.board.placement['S-4'].zone).toBe('p-west');
  // Vice-Bum → Vice-President: one card; and one back.
  expect(ex.board.placement['C-2'].zone).toBe('p-north');
  expect(ex.board.placement['D-3'].zone).toBe('p-east');
});
