import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  /** The real value from the engine. The display always ends exactly here. */
  value: number;
  durationMs?: number;
  /** Optional formatter. Receives the exact value at the end of the animation. */
  format?: (n: number) => string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Counts up/down to `value`. With reduced motion (or no matchMedia, e.g. jsdom)
 * it shows the new value immediately. Renders a single text element and is not a
 * live region, so screen readers are not spammed on every frame.
 */
export function AnimatedCounter({ value, durationMs = 400, format }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = t >= 1 ? value : from + (value - from) * easeOut(t);
      fromRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduced]);

  const shown = reduced ? value : display;
  const text = format ? format(shown) : String(shown === value ? value : Math.round(shown));
  return <span>{text}</span>;
}
