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
  });
  const ids = Object.keys(snapshot.board.placement);

  return (
    <div ref={ref} className="table-felt" style={{ height: dims.height }}>
      {ids.map((id) => (
        <Card key={id} id={id} t={transforms[id]} w={dims.cardW} h={dims.cardH} />
      ))}
    </div>
  );
}
