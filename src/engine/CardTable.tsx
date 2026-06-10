import { useEffect, useRef, useState } from 'react';
import type { ZoneDef } from './types';
import type { Snapshot } from './runGame';
import { tableDims, computeTransforms, collapseTransforms, zonePoint, gridDrift, gridDriftX } from './layout';
import { cardsInZone } from './board';
import { Card, FLIP_SECONDS } from './Card';

export function CardTable({
  snapshot,
  zones,
  collapsed = false,
}: {
  snapshot: Snapshot;
  zones: ZoneDef[];
  collapsed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dims = tableDims(width || 800);
  const transforms = collapsed
    ? collapseTransforms(snapshot.board, dims)
    : computeTransforms(snapshot.board, zones, dims, {
        highlight: snapshot.step.highlight,
        spotlight: snapshot.step.spotlight,
        stagger: snapshot.step.stagger ? new Set(snapshot.step.stagger) : undefined,
        known: snapshot.step.known,
      });
  const ids = Object.keys(snapshot.board.placement);
  const spotlight = snapshot.step.spotlight ? new Set(snapshot.step.spotlight) : null;

  // Choreograph multi-beat steps. When a card turns face DOWN and travels in
  // the same step (a kept draw heading into a square), it conceals first: its
  // flip plays in place, and EVERY travelling card in the step (the kept card
  // and whatever it displaces) waits for that flip, then sets off together.
  // Reveals still flip in flight alongside their move.
  const prevBoardRef = useRef(snapshot.board);
  const prevBoard = prevBoardRef.current;
  useEffect(() => {
    prevBoardRef.current = snapshot.board;
  }, [snapshot.board]);
  if (!collapsed && prevBoard !== snapshot.board) {
    const moved = (id: string) => {
      const a = prevBoard.placement[id];
      const b = snapshot.board.placement[id];
      return !!a && !!b && (a.zone !== b.zone || a.order !== b.order);
    };
    const conceals = (id: string) =>
      (prevBoard.faceUp[id] ?? false) && !(snapshot.board.faceUp[id] ?? false);
    const movedIds = ids.filter(moved);
    if (movedIds.some(conceals)) {
      for (const id of movedIds) {
        const t = transforms[id];
        transforms[id] = {
          ...t,
          moveDelay: t.delay + FLIP_SECONDS,
          flipDelay: conceals(id) ? t.delay : t.delay + FLIP_SECONDS,
        };
      }
    }
  }

  return (
    <div
      ref={ref}
      className={`table-felt ${snapshot.step.impact ? 'table-shake' : ''}`}
      style={{ height: dims.height }}
    >
      {!collapsed && snapshot.step.banner && (
        <div className="table-banner absolute left-1/2 top-2 -translate-x-1/2">
          {snapshot.step.banner}
        </div>
      )}
      {!collapsed && zones
        .filter((z) => z.label)
        .map((z) => {
          const { x: cx, y: cy } = zonePoint(z.anchor, dims);
          const pos = z.labelPos ?? 'below';
          const horizontal = pos === 'left' || pos === 'right';
          // Piles creep upward as they grow; grids extend half a row (and half
          // a column) both ways. Hug the player label just past the outermost
          // card (with a little headroom) so it never sits over a card.
          const count = cardsInZone(snapshot.board, z.id).length;
          let x = cx;
          let y = cy;
          if (horizontal) {
            const driftX = z.layout === 'grid' ? gridDriftX(z, count, dims) : 0;
            const gapX = dims.cardW * 0.12;
            x = cx + (pos === 'right' ? 1 : -1) * (dims.cardW / 2 + driftX + gapX);
          } else {
            const driftAbove =
              z.layout === 'pile' ? Math.max(0, count - 1) * 0.5
              : z.layout === 'grid' ? gridDrift(z, count, dims)
              : 0;
            const driftBelow = z.layout === 'grid' ? gridDrift(z, count, dims) : 0;
            const gap = dims.cardH * 0.08;
            y = pos === 'above'
              ? cy - dims.cardH / 2 - driftAbove - gap
              : cy + dims.cardH / 2 + driftBelow + gap;
          }

          const dim = spotlight ? !spotlight.has(z.id) : false;
          const status = snapshot.step.status?.[z.id];
          const muted = status ? /^(pass|done|skipped)$/i.test(status) : false;
          // A seat carrying a status word stays legible even when its cards are dimmed.
          const labelOpacity = status ? 0.95 : dim ? 0.4 : 0.9;

          // The player label hugs the cards. On a side-positioned seat the
          // name stays centred on its card rows and the status chip is lifted
          // out of flow, perched just above the name (sharing its card-side
          // edge) so its arrival never nudges the name. A vertically-
          // positioned label keeps the chip in flow on the far side of the
          // name (away from the cards) so nothing overlaps.
          const chip = status && (
            <span className={`zone-label-status ${muted ? 'is-muted' : ''}`}>{status}</span>
          );
          const chipFirst = pos === 'above';
          const transform = horizontal
            ? pos === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)'
            : pos === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
          const name = (
            <span
              className="zone-label-main"
              style={z.labelColor ? { background: z.labelColor } : undefined}
            >
              {z.label}
            </span>
          );
          return (
            <div
              key={`label-${z.id}`}
              className={`table-zone-label absolute pointer-events-none transition-opacity duration-500 ${
                horizontal ? '' : 'flex flex-col items-center gap-0.5'
              }`}
              style={{
                left: x,
                top: y,
                transform,
                opacity: labelOpacity,
              }}
            >
              {horizontal ? (
                <>
                  {chip && (
                    <span
                      className={`absolute bottom-full mb-1 whitespace-nowrap ${
                        pos === 'left' ? 'right-0' : 'left-0'
                      }`}
                    >
                      {chip}
                    </span>
                  )}
                  {name}
                </>
              ) : (
                <>
                  {chipFirst && chip}
                  {name}
                  {!chipFirst && chip}
                </>
              )}
            </div>
          );
        })}
      {ids.map((id) => (
        <Card key={id} id={id} t={transforms[id]} w={dims.cardW} h={dims.cardH} />
      ))}
    </div>
  );
}
