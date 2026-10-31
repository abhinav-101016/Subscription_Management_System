import Lenis from 'lenis';

let lenisInstance = null;
let rafId = null;

/**
 * Initializes Lenis smooth scrolling.
 * Always returns a safe cleanup function () => void.
 */
export function initSmoothScroll(wrapperElement = null) {
  if (typeof window === 'undefined') return () => {};

  // Respect reduced-motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return () => {};

  // Don't initialize on purely primary touch devices without fine pointers
  const isPureTouch = 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches;
  if (isPureTouch) return () => {};

  try {
    if (lenisInstance) {
      try {
        lenisInstance.destroy();
      } catch (_) {}
      lenisInstance = null;
    }

    const options = {
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    };

    if (wrapperElement) {
      options.wrapper = wrapperElement;
      options.content = wrapperElement.firstElementChild || wrapperElement;
    }

    lenisInstance = new Lenis(options);

    function raf(time) {
      if (lenisInstance) {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      }
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (lenisInstance) {
        try {
          lenisInstance.destroy();
        } catch (_) {}
        lenisInstance = null;
      }
    };
  } catch (e) {
    console.warn('Lenis smooth scroll failed to initialize:', e);
    return () => {};
  }
}

export function pauseScroll() {
  if (lenisInstance) {
    try {
      lenisInstance.stop();
    } catch (_) {}
  }
}

export function resumeScroll() {
  if (lenisInstance) {
    try {
      lenisInstance.start();
    } catch (_) {}
  }
}

export function getLenis() {
  return lenisInstance;
}
