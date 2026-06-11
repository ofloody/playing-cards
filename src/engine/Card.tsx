import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { CardTransform } from './types';
import { parseCard, isRed } from './deck';

const GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const FLIP_SECONDS = 0.5;

export function Card({
  id, t, w, h,
}: { id: string; t: CardTransform; w: number; h: number }) {
  const { suit, rank } = parseCard(id);
  const colour = isRed(suit) ? 'var(--color-suit-red)' : 'var(--color-suit-ink)';

  // CardTable choreographs multi-beat steps via moveDelay/flipDelay (e.g. a
  // kept card flips face down in place before everything travels together).
  const spring = { type: 'spring', stiffness: 120, damping: 18, mass: 0.6 } as const;
  const moveDelay = t.moveDelay ?? t.delay;
  const flipDelay = t.flipDelay ?? t.delay;

  // Whether this card's peek flap is mid-descent: the memory ghost it leaves
  // behind waits for the flap to land before fading in.
  const prevPeek = useRef(false);
  const peekJustEnded = prevPeek.current && !t.peek;
  useEffect(() => {
    prevPeek.current = t.peek;
  }, [t.peek]);

  return (
    <motion.div
      className="absolute left-0 top-0 will-change-transform"
      style={{ width: w, height: h, zIndex: (t.highlight || t.peek ? 1000 : 0) + t.z }}
      initial={false}
      animate={{
        x: t.x - w / 2,
        y: t.y - h / 2 - (t.peek ? h * 0.07 : 0),
        rotate: t.rotate,
        scale: t.peek ? 1.12 : t.highlight ? 1.06 : 1,
        // Dim with a filter, never opacity: transparent cards stack badly in
        // piles (everything underneath bleeds through the top card).
        // A peeked card instead lifts off the felt on a deep drop shadow.
        filter: t.dim
          ? 'saturate(0.3) brightness(0.78)'
          : t.peek
            ? 'saturate(1) brightness(1) drop-shadow(0 8px 7px rgba(0,0,0,0.38))'
            : 'saturate(1) brightness(1)',
      }}
      transition={{
        default: { ...spring, delay: moveDelay },
        scale: { ...spring, delay: t.delay },
        filter: { duration: 0.3, delay: t.delay },
      }}
    >
      <motion.div
        className="card-inner"
        animate={{ rotateY: t.faceUp ? 0 : 180 }}
        transition={{ duration: FLIP_SECONDS, ease: 'easeInOut', delay: flipDelay }}
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
        <motion.div
          className="card-face card-back"
          style={{
            boxShadow: `inset 0 0 0 ${w * 0.08}px #fff, inset 0 0 0 ${w * 0.105}px #000, 3px 3px 0 rgba(0,0,0,0.22)`,
            backgroundSize: `${w * 0.16}px 100%, 100% 100%`,
          }}
          initial={false}
          // While the peek flap is bent up, the card's bottom half is gone
          // from the table: clip it away the instant the flap (which renders
          // an identical bottom slice of the back) starts lifting, and restore
          // it just before the flap settles flat again.
          animate={{ clipPath: t.peek ? 'inset(0 0 50% 0)' : 'inset(0 0 0% 0)' }}
          transition={{
            duration: 0.01,
            delay: t.peek ? t.delay : t.delay + FLIP_SECONDS * 0.85,
          }}
        >
          {/* The memory ghost waits until the glance is over: while the card
              is lifted for a peek, the reveal flap is the only face showing,
              and the ghost fades in only once the flap has settled flat. */}
          {t.known && !t.peek && (
            <motion.span
              className="card-memory"
              style={{ color: colour, fontSize: w * 0.3 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: peekJustEnded ? FLIP_SECONDS * 0.9 : 0,
              }}
            >
              {rank}
              <span style={{ fontSize: w * 0.26 }}>{GLYPH[suit]}</span>
            </motion.span>
          )}
        </motion.div>
      </motion.div>
      {/* The peek: a private glance. The card bends at its waist: the bottom
          half lifts off the felt (the near edge swelling with perspective) and
          folds back, showing the face on its underside, index in the corner
          and the centre pip cut at the fold, like a real card bent for a look.
          The card never counts as face up, and the flap exists only while its
          card is peeked: every other card stays a single unsplit element. */}
      <AnimatePresence>
        {t.peek && (
          <div className="card-peek-hinge">
            <motion.div
              className="card-peek-flap"
              initial={{ rotateX: 0, y: 0 }}
              // the slight downward nudge tucks the folded flap over the cut
              // edge of the clipped back, so no seam peeks out beneath it; it
              // arrives only once the flap has folded past vertical, and on
              // the way down it snaps flush first, so the descending flap
              // never hangs below the card's top half with a gap between
              animate={{ rotateX: 140, y: h * 0.05 }}
              exit={{
                rotateX: 0,
                y: 0,
                transition: {
                  rotateX: { duration: FLIP_SECONDS, ease: 'easeInOut' },
                  y: { duration: FLIP_SECONDS * 0.15, ease: 'easeOut' },
                },
              }}
              transition={{
                rotateX: { duration: FLIP_SECONDS, ease: 'easeInOut', delay: t.delay },
                y: {
                  duration: FLIP_SECONDS * 0.35,
                  ease: 'easeOut',
                  delay: t.delay + FLIP_SECONDS * 0.55,
                },
              }}
            >
              {/* what the table sees: the bottom slice of the back, lifting away */}
              <div className="card-peek-flap-side">
                {/* an exact replica of the real card back, so the lifting
                    slice is indistinguishable from the card it came off */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '-100%',
                    width: '100%',
                    height: '200%',
                    borderRadius: '0.18rem',
                    border: '2px solid #000',
                    background:
                      'linear-gradient(90deg, var(--color-accent-red) 0 50%, transparent 50% 100%), #fff',
                    backgroundRepeat: 'repeat, no-repeat',
                    backgroundSize: `${w * 0.16}px 100%, 100% 100%`,
                    boxShadow: `inset 0 0 0 ${w * 0.08}px #fff, inset 0 0 0 ${w * 0.105}px #000, 3px 3px 0 rgba(0,0,0,0.22)`,
                  }}
                />
              </div>
              {/* what the peeker sees: the face's corner on the underside */}
              <div className="card-peek-flap-side card-peek-flap-underside" style={{ color: colour }}>
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
                    bottom: -w * 0.25,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: w * 0.5,
                    lineHeight: 1,
                  }}
                >
                  {GLYPH[suit]}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
