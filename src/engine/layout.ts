import type { Board, CardId, CardTransform, ZoneDef } from './types';
import { cardsInZone } from './board';

export interface TableDims {
  width: number;
  height: number;
  cardW: number;
  cardH: number;
}

export function tableDims(width: number): TableDims {
  const height = width * 0.62;
  const cardW = width * 0.092;
  const cardH = cardW * 1.4;
  return { width, height, cardW, cardH };
}

// Deterministic small rotation (-2..2deg) from a card id, for natural-looking piles.
function jitter(id: CardId): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100;
  return (h / 100 - 0.5) * 4;
}

export function computeTransforms(
  board: Board,
  zones: ZoneDef[],
  dims: TableDims,
  opts: { highlight?: CardId[]; spotlight?: string[] } = {},
): Record<CardId, CardTransform> {
  const result: Record<CardId, CardTransform> = {};
  const highlight = new Set(opts.highlight ?? []);
  const spotlight = opts.spotlight ? new Set(opts.spotlight) : null;

  for (const zone of zones) {
    const cards = cardsInZone(board, zone.id);
    const n = cards.length;
    const cx = zone.anchor.x * dims.width;
    const cy = zone.anchor.y * dims.height;
    const dimZone = spotlight ? !spotlight.has(zone.id) : false;

    cards.forEach((id, i) => {
      let x = cx;
      let y = cy;
      let rotate = zone.rotate ?? 0;

      if (zone.layout === 'pile') {
        x = cx + i * 0.3;
        y = cy - i * 0.5;
        rotate += jitter(id);
      } else if (zone.layout === 'row') {
        const gap = (zone.gap ?? 0.08) * dims.width;
        x = cx - ((n - 1) * gap) / 2 + i * gap;
      } else if (zone.layout === 'fan') {
        const spread = (zone.gap ?? 0.05) * dims.width;
        x = cx - ((n - 1) * spread) / 2 + i * spread;
        const mid = (n - 1) / 2;
        rotate += (i - mid) * 4;
        y = cy + Math.abs(i - mid) * 2;
      }

      result[id] = {
        x, y, rotate,
        faceUp: board.faceUp[id] ?? false,
        z: i,
        highlight: highlight.has(id),
        dim: dimZone && !highlight.has(id),
      };
    });
  }
  return result;
}
