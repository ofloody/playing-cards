import type { ZoneDef } from './types';

export interface NarrationSegment {
  text: string;
  color?: string; // set when the segment is a player-name mention
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Split narration into plain runs and player-name mentions. A mention is an
// exact, case-sensitive occurrence of a zone's `label` for any zone that
// declares a `labelColor`, taken as a whole word: not embedded in another
// word, and not the start of a longer one ("You" never claims "Your").
// Possessives ("Across’s") still match: the apostrophe ends the word.
export function segmentNarration(text: string, zones: ZoneDef[]): NarrationSegment[] {
  const named = zones.filter((z) => z.label && z.labelColor);
  if (named.length === 0) return [{ text }];

  const colorOf = new Map(named.map((z) => [z.label as string, z.labelColor as string]));
  // Longest label first so "Side Pot" would win over "Side".
  const labels = [...colorOf.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const re = new RegExp(`(?<![A-Za-z])(?:${labels.join('|')})(?![a-z])`, 'g');

  const segments: NarrationSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) segments.push({ text: text.slice(last, at) });
    segments.push({ text: m[0], color: colorOf.get(m[0]) });
    last = at + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
