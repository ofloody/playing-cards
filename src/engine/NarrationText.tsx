import type { ZoneDef } from './types';
import { segmentNarration } from './narration';

// Narration with player names and cards picked out. A mention of a zone label
// whose zone declares a `labelColor` renders as a bold ink-on-colour mark,
// matching the seat's label chip on the felt. A "rank of suit" phrase renders
// as a bold rank + suit glyph, red for hearts/diamonds and ink for the rest.
export function NarrationText({ text, zones }: { text: string; zones: ZoneDef[] }) {
  return (
    <>
      {segmentNarration(text, zones).map((seg, i) => {
        if (seg.color) {
          return (
            <strong key={i} className="player-name" style={{ backgroundColor: seg.color }}>
              {seg.text}
            </strong>
          );
        }
        if (seg.card) {
          return (
            <strong key={i} className="card-ref" data-red={seg.card.red || undefined}>
              {seg.card.rank}
              <span className="card-ref-suit">{seg.card.suit}</span>
            </strong>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}
