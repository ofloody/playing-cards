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
  const cardW = width * 0.08;
  const cardH = cardW * 1.4;
  return { width, height, cardW, cardH };
}

// Maps a zone anchor (0..1) into an inset region of the felt so that cards, even
// when scaled up and glowing with the highlight, always keep clear of the border.
export function zonePoint(
  anchor: { x: number; y: number },
  dims: TableDims,
): { x: number; y: number } {
  const padX = dims.cardW * 0.4;
  const padY = dims.cardH * 0.14;
  return {
    x: padX + anchor.x * (dims.width - 2 * padX),
    y: padY + anchor.y * (dims.height - 2 * padY),
  };
}

// Deterministic small rotation (-2..2deg) from a card id, for natural-looking piles.
function jitter(id: CardId): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100;
  return (h / 100 - 0.5) * 4;
}

// Column/row pitch of a 'grid' zone: one card plus a thin gutter.
// zone.gap is the gutter as a fraction of table width (default 0.012).
function gridSteps(zone: ZoneDef, dims: TableDims): { stepX: number; stepY: number } {
  const gutter = (zone.gap ?? 0.012) * dims.width;
  return { stepX: dims.cardW + gutter, stepY: dims.cardH + gutter };
}

// How far a grid's outer rows extend beyond a single card centred on the
// anchor. CardTable uses this to keep zone labels clear of the square.
export function gridDrift(zone: ZoneDef, count: number, dims: TableDims): number {
  const rows = Math.ceil(Math.max(count, 1) / 2);
  return ((rows - 1) * gridSteps(zone, dims).stepY) / 2;
}

// The horizontal counterpart: how far a grid's columns extend beyond a single
// card centred on the anchor. Used for 'left'/'right' zone labels.
export function gridDriftX(zone: ZoneDef, count: number, dims: TableDims): number {
  const cols = Math.min(Math.max(count, 1), 2);
  return ((cols - 1) * gridSteps(zone, dims).stepX) / 2;
}

// Seconds of delay added per card index, in a zone that's "staggered" this step.
const STAGGER_UNIT = 0.09;

// All cards gathered into a loose face-keeping stack at the table's centre. Used
// as a transient frame when the walkthrough loops from its last step back to the
// first: the deck visibly re-gathers to the middle and deals out again, instead
// of replaying every step in fast-reverse as the page scrolls back up.
export function collapseTransforms(
  board: Board,
  dims: TableDims,
): Record<CardId, CardTransform> {
  const cx = dims.width / 2;
  const cy = dims.height / 2;
  const result: Record<CardId, CardTransform> = {};
  Object.keys(board.placement).forEach((id, i) => {
    result[id] = {
      x: cx + i * 0.3,
      y: cy - i * 0.5,
      rotate: jitter(id),
      faceUp: board.faceUp[id] ?? false,
      z: i,
      highlight: false,
      dim: false,
      known: false,
      peek: false,
      delay: 0,
    };
  });
  return result;
}

export function computeTransforms(
  board: Board,
  zones: ZoneDef[],
  dims: TableDims,
  opts: { highlight?: CardId[]; spotlight?: string[]; stagger?: Set<string>; known?: CardId[]; peek?: CardId[] } = {},
): Record<CardId, CardTransform> {
  const result: Record<CardId, CardTransform> = {};
  const highlight = new Set(opts.highlight ?? []);
  const spotlight = opts.spotlight ? new Set(opts.spotlight) : null;
  const known = new Set(opts.known ?? []);
  const peek = new Set(opts.peek ?? []);

  for (const zone of zones) {
    const cards = cardsInZone(board, zone.id);
    const n = cards.length;
    const { x: cx, y: cy } = zonePoint(zone.anchor, dims);
    const dimZone = spotlight ? !spotlight.has(zone.id) : false;
    const staggered = opts.stagger?.has(zone.id) ?? false;

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
      } else if (zone.layout === 'grid') {
        // Two columns centred on the anchor; order index 0..3 reads
        // top-left, top-right, bottom-left, bottom-right.
        const { stepX, stepY } = gridSteps(zone, dims);
        const cols = 2;
        const rows = Math.ceil(n / cols);
        x = cx - ((cols - 1) * stepX) / 2 + (i % cols) * stepX;
        y = cy - ((rows - 1) * stepY) / 2 + Math.floor(i / cols) * stepY;
      }

      result[id] = {
        x, y, rotate,
        faceUp: board.faceUp[id] ?? false,
        z: i,
        highlight: highlight.has(id),
        dim: dimZone && !highlight.has(id),
        known: known.has(id),
        peek: peek.has(id),
        delay: staggered ? i * STAGGER_UNIT : 0,
      };
    });
  }
  return result;
}
