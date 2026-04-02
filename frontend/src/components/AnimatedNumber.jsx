import { useEffect, useState } from 'react';

export function AnimatedNumber({ value = 0, duration = 450, className = '' }) {
  const numericValue = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(numericValue);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();
    const initialValue = displayValue;

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      const nextValue = Math.round(initialValue + ((numericValue - initialValue) * eased));
      setDisplayValue(nextValue);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, numericValue]);

  return <span className={className}>{displayValue}</span>;
}
