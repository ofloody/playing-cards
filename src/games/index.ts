import type { Game } from '../engine/types';
import { war } from './war';
import { president } from './president';
import { cabo } from './cabo';

// Sorted by title so the home grid lists games alphabetically.
export const games: Game[] = [war, president, cabo].sort((a, b) =>
  a.title.localeCompare(b.title),
);
export const gameMap: Record<string, Game> = Object.fromEntries(
  games.map((g) => [g.id, g]),
);
