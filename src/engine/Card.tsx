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
        // Dim with a filter, never opacity: transparent cards stack badly in
        // piles (everything underneath bleeds through the top card).
        filter: t.dim ? 'saturate(0.3) brightness(0.78)' : 'saturate(1) brightness(1)',
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
          style={{ color: colour }}
        >
          <span
            style={{
              position: 'absolute',
              top: w * 0.09,
              left: w * 0.09,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: w * 0.28,
              lineHeight: 1,
            }}
          >
            {rank}
            <span style={{ fontSize: w * 0.24 }}>{GLYPH[suit]}</span>
          </span>
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: w * 0.5,
              lineHeight: 1,
            }}
          >
            {GLYPH[suit]}
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: w * 0.09,
              right: w * 0.09,
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
        <div
          className="card-face card-back"
          style={{
            boxShadow: `inset 0 0 0 ${w * 0.08}px #fff, inset 0 0 0 ${w * 0.105}px #000, 3px 3px 0 rgba(0,0,0,0.22)`,
            backgroundSize: `${w * 0.16}px 100%, 100% 100%`,
          }}
        >
          {t.known && (
            <span className="card-memory" style={{ color: colour, fontSize: w * 0.3 }}>
              {rank}
              <span style={{ fontSize: w * 0.26 }}>{GLYPH[suit]}</span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
