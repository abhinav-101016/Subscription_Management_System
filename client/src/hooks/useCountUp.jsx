import { useState, useEffect } from 'react';

/**
 * Custom React hook for animating KPI numbers smoothly
 * @param {number} targetValue - The target value to animate towards
 * @param {number} duration - Total animation time in ms (default 900ms)
 */
export function useCountUp(targetValue, duration = 800) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = currentValue;
    const difference = Number(targetValue) - startValue;

    if (difference === 0) return;

    // Ease out cubic: f(t) = 1 - (1 - t)^3
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const nextValue = startValue + difference * easedProgress;
      setCurrentValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(Number(targetValue));
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration]);

  return currentValue;
}
