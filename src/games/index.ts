import type { Game } from '../engine/types';
import { war } from './war';
import { president } from './president';

export const games: Game[] = [war, president];
export const gameMap: Record<string, Game> = Object.fromEntries(
  games.map((g) => [g.id, g]),
);
