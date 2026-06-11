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

test('the initial peek lifts your nearest two for a glance, never face up', () => {
  const peek = at('peek');
  expect(peek.step.peek).toEqual(['S-A', 'C-10']);
  // a peek is a private glance: the cards stay face down on the board
  expect(peek.board.faceUp['S-A']).toBe(false);
  expect(peek.board.faceUp['C-10']).toBe(false);
  expect(at('peek-back').step.peek).toBeUndefined();
});

test('replace-in-place keeps the square slots stable', () => {
  const { board } = at('first-replace');
  // the drawn 3 takes the 9's exact corner; the other three never move
  expect(cardsInZone(board, 'p-you')).toEqual(['D-3', 'D-K', 'S-A', 'C-10']);
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

test('the lucky seven offers the choice, the next step peeks the king', () => {
  // step one of the power: the seven is drawn, nothing is revealed yet
  const seven = at('lucky-seven');
  expect(cardsInZone(seven.board, 'drawn')).toEqual(['S-7']);
  expect(seven.step.peek).toBeUndefined();
  // step two: the peek itself, a lifted glance with the seven spent;
  // the king never counts as face up on the board
  const peek = at('king-peek');
  expect(peek.step.impact).toBe(true);
  expect(peek.step.peek).toEqual(['D-K']);
  expect(peek.board.faceUp['D-K']).toBe(false);
  expect(peek.board.placement['D-K'].zone).toBe('p-you');
  expect(topOf(peek.board, 'discard')).toEqual(['S-7']);
  // and the glance is over as the turn passes to Side, who peeks your three
  expect(at('side-peeks-you').step.peek).toEqual(['D-3']);
});

test('the switcheroo trades exact slots between Across and Side', () => {
  const { board } = at('switcheroo');
  expect(board.placement['S-6'].zone).toBe('p-across');
  expect(board.placement['S-8'].zone).toBe('p-side');
  expect(board.placement['S-8'].order).toBe(3); // Side's exact bottom-right slot
  expect(board.faceUp['S-6']).toBe(false);
  expect(board.faceUp['S-8']).toBe(false);
});

test('the knock: Diagonal flips a matching 3 in place, then it slides off', () => {
  const knock = at('knock');
  expect(knock.step.impact).toBe(true);
  // the reveal happens in the square, not on the pile
  expect(knock.board.placement['C-3'].zone).toBe('p-diagonal');
  expect(knock.board.faceUp['C-3']).toBe(true);
  expect(topOf(knock.board, 'discard')).toEqual(['H-3']);
  // the claim: the three reaches the pile as the next turn begins
  const next = at('six-sense').board;
  expect(topOf(next, 'discard', 2)).toEqual(['H-3', 'C-3']);
  expect(cardsInZone(next, 'p-diagonal').length).toBe(3);
});

test('the race: Side flips first and wrong, in place, while your six baits', () => {
  const race = at('the-race');
  expect(race.step.impact).toBe(true);
  expect(topOf(race.board, 'discard')).toEqual(['H-6']); // your bait on the pile
  // Side's misfire is revealed in their own square, not slammed on the pile
  expect(race.board.placement['S-8'].zone).toBe('p-side');
  expect(race.board.faceUp['S-8']).toBe(true);
  const pen = at('penalty').board;
  expect(pen.faceUp['S-8']).toBe(false); // flips back down where it lies
  expect(cardsInZone(pen, 'p-side')).toEqual(['H-5', 'C-K', 'C-5', 'S-8', 'S-J']);
});

test('your knock: the tracked six flips in Across’s square, then the ten pays', () => {
  const knock = at('your-knock');
  expect(knock.step.impact).toBe(true);
  expect(knock.board.placement['S-6'].zone).toBe('p-across');
  expect(knock.board.faceUp['S-6']).toBe(true);
  const price = at('knock-price').board;
  expect(cardsInZone(price, 'p-you')).toEqual(['D-3', 'D-K', 'S-A']);
  expect(price.placement['C-10'].zone).toBe('p-across');
  expect(topOf(price, 'discard', 2)).toEqual(['H-6', 'S-6']);
});

test('the flurry: Diagonal baits a four and flips both fours in place', () => {
  const flurry = at('flurry-of-fours');
  expect(flurry.step.impact).toBe(true);
  expect(topOf(flurry.board, 'discard')).toEqual(['H-4']);
  for (const four of ['S-4', 'C-4']) {
    expect(flurry.board.placement[four].zone).toBe('p-diagonal');
    expect(flurry.board.faceUp[four]).toBe(true);
  }
  // the fours leave for the pile as the final turn begins
  expect(cardsInZone(at('last-match').board, 'p-diagonal')).toEqual(['C-A']);
});

test('the cabo call shakes the table and names the caller', () => {
  const call = at('cabo');
  expect(call.step.impact).toBe(true);
  expect(call.step.status?.['p-you']).toBe('CABO!');
});

test('the last match: Across flips both twos in place behind the drawn bait', () => {
  const { board, step } = at('last-match');
  expect(step.impact).toBe(true);
  expect(topOf(board, 'discard')).toEqual(['S-2']); // the drawn two as bait
  for (const two of ['D-2', 'H-2']) {
    expect(board.placement[two].zone).toBe('p-across');
    expect(board.faceUp[two]).toBe(true);
  }
  // the twos join the pile at the reveal, shrinking the square to two cards
  expect(cardsInZone(at('reveal').board, 'p-across')).toEqual(['C-9', 'C-10']);
});

test('ghosts belong to whoever is acting, and follow swapped cards', () => {
  expect(at('peek-back').step.known).toEqual(['S-A', 'C-10']);
  expect(at('first-replace').step.known).toContain('D-3');
  expect(at('king-peek').step.known).toContain('D-K');
  // on Side's turn you see SIDE's memory, not yours: their near row,
  // the bottom of their square as drawn (they share your edge)
  expect(at('decline').step.known).toEqual(['D-9', 'S-6']);
  expect(at('side-peeks-you').step.known).toContain('D-3');
  // Diagonal's knock is backed by the three they peeked at the start
  expect(at('knock').step.known).toContain('C-3');
  // back on your turn, the six Across lifted from Side glows in their square
  const friend = at('know-a-friend');
  expect(friend.step.known).toContain('S-6');
  expect(friend.board.placement['S-6'].zone).toBe('p-across');
  // Side lost track of that six: by their misfire it has left their ghosts
  expect(at('the-race').step.known).not.toContain('S-6');
  // your zero king stays put, and stays remembered, through the call
  const call = at('cabo');
  expect(call.step.known).toContain('D-K');
  expect(call.board.placement['D-K'].zone).toBe('p-you');
  expect(at('reveal').step.known).toBeUndefined();
});

test('the CABO sign hangs over the table for the whole last lap', () => {
  for (const id of ['cabo', 'side-too-late', 'flurry-of-fours', 'last-match']) {
    expect(at(id).step.banner).toBeTruthy();
  }
  expect(at('your-knock').step.banner).toBeUndefined();
  expect(at('reveal').step.banner).toBeUndefined();
});

test('every turn step has at most one acting player, except the knock race', () => {
  // a knock interrupts out of turn, so the knocker is the only actor shown;
  // the-race deliberately shows two hands diving for the same knock
  for (const s of snaps) {
    const statuses = Object.values(s.step.status ?? {});
    const actors = statuses.filter((w) => !/^\d|wins/.test(w)).length;
    expect(actors).toBeLessThanOrEqual(s.step.id === 'the-race' ? 2 : 1);
  }
});

test('the reveal: every square face up, and Diagonal steals the hand', () => {
  const { board, step } = at('reveal');
  // the failed Cabo: beaten on 1, your four scores a flat 21 instead
  expect(step.status?.['p-you']).toBe('21!');
  expect(step.status?.['p-diagonal']).toBe('wins on 1');
  expect(cardsInZone(board, 'p-you')).toEqual(['D-3', 'D-K', 'S-A']);  // 3+0+1 = 4
  expect(cardsInZone(board, 'p-across')).toEqual(['C-9', 'C-10']);     // 9+10 = 19
  expect(cardsInZone(board, 'p-diagonal')).toEqual(['C-A']);           // 1: the winner
  expect(cardsInZone(board, 'p-side')).toEqual(['H-5', 'C-K', 'C-5', 'S-8', 'S-J']); // 5+13+5+8+11 = 42
  for (const seat of ['p-you', 'p-side', 'p-diagonal', 'p-across']) {
    for (const id of cardsInZone(board, seat)) expect(board.faceUp[id]).toBe(true);
  }
  expect(cardsInZone(board, 'stock').length).toBe(19);
  expect(cardsInZone(board, 'discard').length).toBe(22);
});
