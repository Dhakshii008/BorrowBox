import { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 1.1, pad = false, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const displayRef = useRef(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduceMotion) {
      displayRef.current = value;
      if (ref.current) ref.current.textContent = pad ? String(value).padStart(2, '0') : String(value);
      return undefined;
    }
    const start = performance.now();
    const from = 0;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (value - from) * eased);
      displayRef.current = current;
      if (ref.current) ref.current.textContent = pad ? String(current).padStart(2, '0') : String(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, pad, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {pad ? String(0).padStart(2, '0') : '0'}
    </span>
  );
}