import type { ZoneDef } from './types';

export interface NarrationSegment {
  text: string;
  color?: string; // set when the segment is a player-name mention
  card?: { rank: string; suit: string; red: boolean }; // set for a card mention
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "three of diamonds" -> 3♦, and the literal shorthand "3♦" as authored.
// Word-form ranks and suits only for the prose form, so bare ranks used as
// counts ("your two", "two-by-two") are never mistaken for cards.
const RANK_LABEL: Record<string, string> = {
  ace: 'A', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7',
  eight: '8', nine: '9', ten: '10', jack: 'J', queen: 'Q', king: 'K',
};
const SUIT_GLYPH: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
const RED_GLYPHS = new Set(['♥', '♦']);
const CARD_RE = new RegExp(
  `\\b(${Object.keys(RANK_LABEL).join('|')}) of (${Object.keys(SUIT_GLYPH).join('|')})\\b` +
    `|(?<![\\w])(A|10|[2-9]|J|Q|K)([♠♥♦♣])`,
  'gi',
);

// Split a plain run, picking out card mentions in either form.
function splitCards(text: string): NarrationSegment[] {
  const segments: NarrationSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(CARD_RE)) {
    const at = m.index ?? 0;
    if (at > last) segments.push({ text: text.slice(last, at) });
    const card = m[1]
      ? {
          rank: RANK_LABEL[m[1].toLowerCase()],
          suit: SUIT_GLYPH[m[2].toLowerCase()],
          red: RED_SUITS.has(m[2].toLowerCase()),
        }
      : { rank: m[3].toUpperCase(), suit: m[4], red: RED_GLYPHS.has(m[4]) };
    segments.push({ text: m[0], card });
    last = at + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

// Split narration into plain runs, player-name mentions, and card mentions.
// A name is an exact, case-sensitive occurrence of a zone's `label` for any
// zone that declares a `labelColor`, taken as a whole word: not embedded in
// another word, and not the start of a longer one ("You" never claims "Your").
// Possessives ("Across’s") still match: the apostrophe ends the word. Card
// mentions are then picked out of whatever prose the names leave behind.
export function segmentNarration(text: string, zones: ZoneDef[]): NarrationSegment[] {
  const named = zones.filter((z) => z.label && z.labelColor);

  let nameSegments: NarrationSegment[];
  if (named.length === 0) {
    nameSegments = [{ text }];
  } else {
    const colorOf = new Map(named.map((z) => [z.label as string, z.labelColor as string]));
    // Longest label first so "Side Pot" would win over "Side".
    const labels = [...colorOf.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
    const re = new RegExp(`(?<![A-Za-z])(?:${labels.join('|')})(?![a-z])`, 'g');

    nameSegments = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const at = m.index ?? 0;
      if (at > last) nameSegments.push({ text: text.slice(last, at) });
      nameSegments.push({ text: m[0], color: colorOf.get(m[0]) });
      last = at + m[0].length;
    }
    if (last < text.length) nameSegments.push({ text: text.slice(last) });
  }

  return nameSegments.flatMap((seg) => (seg.color ? [seg] : splitCards(seg.text)));
}
