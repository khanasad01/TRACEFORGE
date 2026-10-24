import { useEffect, useRef, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
};

function useReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AnimatedCounter({ value, durationMs = 400, format }: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(value);
  const frameRef = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  const startRef = useRef(value);
  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(value);
      startRef.current = value;
      return;
    }
    const start = startRef.current;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setDisplayed(Math.floor(start + (value - start) * progress));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else setDisplayed(value);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, durationMs, prefersReduced]);

  return <span>{format ? format(displayed) : displayed}</span>;
}