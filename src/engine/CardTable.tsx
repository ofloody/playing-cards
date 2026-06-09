import { useEffect, useRef, useState } from 'react';
import type { ZoneDef } from './types';
import type { Snapshot } from './runGame';
import { tableDims, computeTransforms, collapseTransforms, zonePoint, gridDrift, gridDriftX } from './layout';
import { cardsInZone } from './board';
import { Card } from './Card';

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

          // The player label hugs the cards; its status chip sits just beyond it,
          // on the far side of the label (away from the cards) so nothing overlaps.
          const chip = status && (
            <span className={`zone-label-status ${muted ? 'is-muted' : ''}`}>{status}</span>
          );
          const chipFirst = pos === 'above' || pos === 'left';
          const transform = horizontal
            ? pos === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)'
            : pos === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
          return (
            <div
              key={`label-${z.id}`}
              className={`table-zone-label absolute pointer-events-none flex items-center transition-opacity duration-500 ${
                horizontal ? 'flex-row gap-1.5' : 'flex-col gap-0.5'
              }`}
              style={{
                left: x,
                top: y,
                transform,
                opacity: labelOpacity,
              }}
            >
              {chipFirst && chip}
              <span className="zone-label-main">{z.label}</span>
              {!chipFirst && chip}
            </div>
          );
        })}
      {ids.map((id) => (
        <Card key={id} id={id} t={transforms[id]} w={dims.cardW} h={dims.cardH} />
      ))}
    </div>
  );
}
