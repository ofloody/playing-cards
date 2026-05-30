import { motion } from 'motion/react';
import type { CardTransform } from './types';
import { parseCard, isRed } from './deck';

const GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

export function Card({
  id, t, w, h,
}: { id: string; t: CardTransform; w: number; h: number }) {
  const { suit, rank } = parseCard(id);
  const colour = isRed(suit) ? 'var(--color-suit-red)' : 'var(--color-suit-ink)';
  return (
    <motion.div
      className="absolute left-0 top-0 will-change-transform"
      style={{ width: w, height: h, zIndex: (t.highlight ? 1000 : 0) + t.z }}
      initial={false}
      animate={{
        x: t.x - w / 2,
        y: t.y - h / 2,
        rotate: t.rotate,
        scale: t.highlight ? 1.06 : 1,
        opacity: t.dim ? 0.35 : 1,
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.6, delay: t.delay }}
    >
      <motion.div
        className="card-inner"
        animate={{ rotateY: t.faceUp ? 0 : 180 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: t.delay }}
      >
        <div
          className={`card-face card-front ${t.highlight ? 'card-glow' : ''}`}
          style={{
            color: colour,
            padding: w * 0.08,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: w * 0.28, lineHeight: 1 }}>
            {rank}
            <span style={{ fontSize: w * 0.24 }}>{GLYPH[suit]}</span>
          </span>
          <span style={{ alignSelf: 'center', fontSize: w * 0.5 }}>{GLYPH[suit]}</span>
          <span
            style={{
              alignSelf: 'flex-end',
              transform: 'rotate(180deg)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: w * 0.28,
              lineHeight: 1,
            }}
          >
            {rank}
            <span style={{ fontSize: w * 0.24 }}>{GLYPH[suit]}</span>
          </span>
        </div>
        <div className="card-face card-back" />
      </motion.div>
    </motion.div>
  );
}
