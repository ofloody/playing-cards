import type { Game } from '../engine/types';
import { war } from './war';

export const games: Game[] = [war];
export const gameMap: Record<string, Game> = Object.fromEntries(
  games.map((g) => [g.id, g]),
);
