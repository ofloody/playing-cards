import { useEffect, useRef, useState } from 'react';

export function useActiveStep(count: number, enabled = true) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // `enabled` is in the deps so the observer is rebuilt whenever the step panels
  // are (re)mounted, e.g. after the layout switches to the mobile view and back.
  // Without this the observer keeps watching the old, detached panel nodes and
  // `active` gets stuck on whichever step was last seen.
  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count, enabled]);

  const register = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };

  return { active, register };
}
