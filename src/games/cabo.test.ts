import { test, expect } from 'bun:test';
import { cabo } from './cabo';
import { runGame } from '../engine/runGame';
import { cardsInZone, topOf } from '../engine/board';

const snaps = runGame(cabo);
const at = (id: string) => {
  const s = snaps.find((s) => s.step.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

test('cabo reduces to one snapshot per step with no lost cards', () => {
  expect(snaps.length).toBe(cabo.steps.length);
  for (const s of snaps) {
    expect(Object.keys(s.board.placement).length).toBe(52);
  }
});

test('the deal: four per square, a starter on the discard', () => {
  const { board } = at('deal');
  for (const seat of ['p-you', 'p-side', 'p-diagonal', 'p-across']) {
    expect(cardsInZone(board, seat).length).toBe(4);
  }
  expect(cardsInZone(board, 'discard')).toEqual(['H-J']);
  expect(board.faceUp['H-J']).toBe(true);
  expect(cardsInZone(board, 'stock').length).toBe(35);
});

test('the initial peek flips your nearest two up, then back down', () => {
  const peek = at('peek').board;
  expect(peek.faceUp['S-A']).toBe(true);
  expect(peek.faceUp['C-6']).toBe(true);
  const back = at('peek-back').board;
  expect(back.faceUp['S-A']).toBe(false);
  expect(back.faceUp['C-6']).toBe(false);
});

test('replace-in-place keeps the square slots stable', () => {
  const { board } = at('first-replace');
  // the drawn 3 takes the 9's exact corner; the other three never move
  expect(cardsInZone(board, 'p-you')).toEqual(['D-3', 'D-K', 'S-A', 'C-6']);
  expect(board.faceUp['D-3']).toBe(false);
  expect(topOf(board, 'discard')).toEqual(['H-9']);
  expect(board.faceUp['H-9']).toBe(true);
});

test('a taken discard must enter the square', () => {
  const { board } = at('obligation');
  expect(board.placement['D-2'].zone).toBe('p-across');
  expect(board.faceUp['D-2']).toBe(false);
  expect(topOf(board, 'discard')).toEqual(['D-5']);
});

test('the lucky seven peeks the diamond king, then hides it again', () => {
  const seven = at('lucky-seven');
  expect(seven.step.impact).toBe(true);
  expect(seven.board.faceUp['D-K']).toBe(true);
  expect(seven.board.placement['D-K'].zone).toBe('p-you');
  const tuck = at('tuck-back').board;
  expect(tuck.faceUp['D-K']).toBe(false);
  expect(topOf(tuck, 'discard')).toEqual(['S-7']);
});

test('the switcheroo trades exact slots between Across and You', () => {
  const { board } = at('switcheroo');
  expect(board.placement['C-6'].zone).toBe('p-across');
  expect(board.placement['S-8'].zone).toBe('p-you');
  expect(board.placement['S-8'].order).toBe(3); // your exact bottom-right slot
  expect(board.faceUp['C-6']).toBe(false);
  expect(board.faceUp['S-8']).toBe(false);
});

test('the knock: Diagonal slams a matching 3 out of turn', () => {
  const knock = at('knock');
  expect(knock.step.impact).toBe(true);
  expect(topOf(knock.board, 'discard', 2)).toEqual(['H-3', 'C-3']);
  expect(knock.board.placement['H-2'].zone).toBe('p-across');
  expect(knock.board.faceUp['H-2']).toBe(false);
  expect(cardsInZone(knock.board, 'p-diagonal').length).toBe(3);
});

test('your knock: Side’s six hits the pile, your square refills theirs', () => {
  const knock = at('your-knock');
  expect(knock.step.impact).toBe(true);
  expect(cardsInZone(knock.board, 'p-you')).toEqual(['D-3', 'D-K', 'S-A']);
  expect(knock.board.placement['S-8'].zone).toBe('p-side');
  expect(topOf(knock.board, 'discard', 2)).toEqual(['S-6', 'H-6']);
});

test('the cabo call shakes the table and names the caller', () => {
  const call = at('cabo');
  expect(call.step.impact).toBe(true);
  expect(call.step.status?.['p-you']).toBe('CABO!');
});

test('the last match: Across purges both twos and keeps no refill', () => {
  const { board, step } = at('last-match');
  expect(step.impact).toBe(true);
  // matched cards first, the initiating draw on top
  expect(topOf(board, 'discard', 3)).toEqual(['D-2', 'H-2', 'S-2']);
  expect(cardsInZone(board, 'p-across')).toEqual(['C-9', 'C-6']);
});

test('ghosts belong to whoever is acting, and follow swapped cards', () => {
  expect(at('peek-back').step.known).toEqual(['S-A', 'C-6']);
  expect(at('first-replace').step.known).toContain('D-3');
  expect(at('tuck-back').step.known).toContain('D-K');
  // on Side's turn you see SIDE's memory, not yours
  expect(at('decline').step.known).toEqual(['H-5', 'D-9']);
  expect(at('side-peeks-you').step.known).toContain('D-3');
  // Diagonal's knock is backed by the three they peeked at the start
  expect(at('knock').step.known).toContain('C-3');
  // back on your turn, the six you lost still glows in Across's square
  const friend = at('know-a-friend');
  expect(friend.step.known).toContain('C-6');
  expect(friend.board.placement['C-6'].zone).toBe('p-across');
  // your zero king stays put, and stays remembered, through the call
  const call = at('cabo');
  expect(call.step.known).toContain('D-K');
  expect(call.board.placement['D-K'].zone).toBe('p-you');
  expect(at('reveal').step.known).toBeUndefined();
});

test('the CABO sign hangs over the table for the whole last lap', () => {
  for (const id of ['cabo', 'side-too-late', 'diagonal-plays-straight', 'last-match']) {
    expect(at(id).step.banner).toBeTruthy();
  }
  expect(at('your-knock').step.banner).toBeUndefined();
  expect(at('reveal').step.banner).toBeUndefined();
});

test('every turn step has at most one acting player', () => {
  // a knock interrupts out of turn, so the knocker is the only actor shown
  for (const s of snaps) {
    const statuses = Object.values(s.step.status ?? {});
    const actors = statuses.filter((w) => !/^\d|wins/.test(w)).length;
    expect(actors).toBeLessThanOrEqual(1);
  }
});

test('the reveal: every square face up, and your call holds', () => {
  const { board } = at('reveal');
  expect(cardsInZone(board, 'p-you')).toEqual(['D-3', 'D-K', 'S-A']);         // 3+0+1 = 4
  expect(cardsInZone(board, 'p-across')).toEqual(['C-9', 'C-6']);             // 9+6 = 15
  expect(cardsInZone(board, 'p-diagonal')).toEqual(['C-A', 'H-Q', 'C-4']);    // 1+12+4 = 17
  expect(cardsInZone(board, 'p-side')).toEqual(['H-5', 'C-K', 'C-5', 'S-8']); // 5+13+5+8 = 31
  for (const seat of ['p-you', 'p-side', 'p-diagonal', 'p-across']) {
    for (const id of cardsInZone(board, seat)) expect(board.faceUp[id]).toBe(true);
  }
  expect(cardsInZone(board, 'stock').length).toBe(20);
  expect(cardsInZone(board, 'discard').length).toBe(20);
});
