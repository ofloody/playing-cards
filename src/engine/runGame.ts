import type { Board, Game, Step } from './types';

export interface Snapshot {
  board: Board;
  step: Step;
  index: number;
}

export function runGame(game: Game): Snapshot[] {
  let board = game.build();
  return game.steps.map((step, index) => {
    board = step.apply(board);
    return { board, step, index };
  });
}
