import { useEffect, useRef, useState } from 'react';
import type { ZoneDef } from './types';
import type { Snapshot } from './runGame';
import { tableDims, computeTransforms, collapseTransforms, zonePoint } from './layout';
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
      });
  const ids = Object.keys(snapshot.board.placement);
  const spotlight = snapshot.step.spotlight ? new Set(snapshot.step.spotlight) : null;

  return (
    <div
      ref={ref}
      className={`table-felt ${snapshot.step.impact ? 'table-shake' : ''}`}
      style={{ height: dims.height }}
    >
      {!collapsed && zones
        .filter((z) => z.label)
        .map((z) => {
          const { x, y: cy } = zonePoint(z.anchor, dims);
          const above = z.labelPos === 'above';
          // Piles creep upward as they grow; hug the player label just past the
          // topmost card (with a little headroom) so it never sits over a card.
          const count = cardsInZone(snapshot.board, z.id).length;
          const drift = z.layout === 'pile' ? Math.max(0, count - 1) * 0.5 : 0;
          const gap = dims.cardH * 0.08;
          const y = above ? cy - dims.cardH / 2 - drift - gap : cy + dims.cardH / 2 + gap;

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
          return (
            <div
              key={`label-${z.id}`}
              className="table-zone-label absolute pointer-events-none flex flex-col items-center gap-0.5 transition-opacity duration-500"
              style={{
                left: x,
                top: y,
                transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                opacity: labelOpacity,
              }}
            >
              {above && chip}
              <span className="zone-label-main">{z.label}</span>
              {!above && chip}
            </div>
          );
        })}
      {ids.map((id) => (
        <Card key={id} id={id} t={transforms[id]} w={dims.cardW} h={dims.cardH} />
      ))}
    </div>
  );
}
