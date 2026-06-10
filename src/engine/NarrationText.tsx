import type { ZoneDef } from './types';
import { segmentNarration } from './narration';

// Narration with player names picked out: any mention of a zone label whose
// zone declares a `labelColor` renders as a bold ink-on-colour mark, matching
// the seat's label chip on the felt.
export function NarrationText({ text, zones }: { text: string; zones: ZoneDef[] }) {
  return (
    <>
      {segmentNarration(text, zones).map((seg, i) =>
        seg.color ? (
          <strong key={i} className="player-name" style={{ backgroundColor: seg.color }}>
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
