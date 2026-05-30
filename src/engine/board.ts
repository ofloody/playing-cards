import type { Board, CardId } from './types';

export function emptyBoard(): Board {
  return { placement: {}, faceUp: {} };
}

export function placeAll(ids: CardId[], zone: string, faceUp: boolean): Board {
  const board = emptyBoard();
  ids.forEach((id, i) => {
    board.placement[id] = { zone, order: i };
    board.faceUp[id] = faceUp;
  });
  return board;
}

export function cardsInZone(board: Board, zone: string): CardId[] {
  return Object.keys(board.placement)
    .filter((id) => board.placement[id].zone === zone)
    .sort((a, b) => board.placement[a].order - board.placement[b].order);
}

export function topOf(board: Board, zone: string, n = 1): CardId[] {
  const cards = cardsInZone(board, zone);
  return cards.slice(Math.max(0, cards.length - n));
}

function clone(board: Board): Board {
  const placement: Board['placement'] = {};
  for (const [k, v] of Object.entries(board.placement)) placement[k] = { ...v };
  return { placement, faceUp: { ...board.faceUp } };
}

// Moves cards to the END of `zone`. Assumes cards originate from another zone
// (the engine never reorders cards within a single zone).
export function move(
  board: Board,
  ids: CardId[],
  zone: string,
  opts: { faceUp?: boolean } = {},
): Board {
  const next = clone(board);
  let order = cardsInZone(next, zone).length;
  for (const id of ids) {
    next.placement[id] = { zone, order: order++ };
    if (opts.faceUp !== undefined) next.faceUp[id] = opts.faceUp;
  }
  return next;
}

export function flip(board: Board, ids: CardId[], faceUp: boolean): Board {
  const next = clone(board);
  for (const id of ids) next.faceUp[id] = faceUp;
  return next;
}
