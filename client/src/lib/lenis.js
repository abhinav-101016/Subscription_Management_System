import Lenis from 'lenis';

let lenisInstance = null;

export function initSmoothScroll() {
  if (typeof window === 'undefined') return null;

  // Respect reduced-motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;

  // Don't initialize on primary touch devices
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return null;

  if (lenisInstance) return lenisInstance;

  try {
    lenisInstance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    function raf(time) {
      if (lenisInstance) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
    }

    requestAnimationFrame(raf);
    return lenisInstance;
  } catch (e) {
    console.warn('Lenis smooth scroll failed to initialize:', e);
    return null;
  }
}

export function pauseScroll() {
  if (lenisInstance) lenisInstance.stop();
}

export function resumeScroll() {
  if (lenisInstance) lenisInstance.start();
}
