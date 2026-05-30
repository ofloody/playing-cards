import { useEffect, useRef, useState } from 'react';
import type { ZoneDef } from './types';
import type { Snapshot } from './runGame';
import { tableDims, computeTransforms } from './layout';
import { Card } from './Card';

export function CardTable({ snapshot, zones }: { snapshot: Snapshot; zones: ZoneDef[] }) {
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
  const transforms = computeTransforms(snapshot.board, zones, dims, {
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
      {zones
        .filter((z) => z.label)
        .map((z) => {
          const x = z.anchor.x * dims.width;
          const y =
            z.anchor.y * dims.height +
            (z.labelPos === 'above' ? -dims.cardH * 0.72 : dims.cardH * 0.72);
          const dim = spotlight ? !spotlight.has(z.id) : false;
          const status = snapshot.step.status?.[z.id];
          const muted = status ? /^(pass|done|skipped)$/i.test(status) : false;
          // A seat carrying a status word stays legible even when its cards are dimmed.
          const labelOpacity = status ? 0.95 : dim ? 0.4 : 0.9;
          return (
            <div
              key={`label-${z.id}`}
              className="absolute pointer-events-none flex flex-col items-center gap-0.5 transition-opacity duration-500"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                opacity: labelOpacity,
              }}
            >
              <span className="font-body font-medium text-[0.64rem] uppercase tracking-[0.22em] text-ink">
                {z.label}
              </span>
              {status && (
                <span
                  className={`font-body text-[0.62rem] tracking-[0.08em] ${
                    muted ? 'text-ink-soft italic' : 'text-accent font-semibold'
                  }`}
                >
                  {status}
                </span>
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
