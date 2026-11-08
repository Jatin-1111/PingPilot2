'use client';

import { useCallback, useEffect, useState } from 'react';
import { animateView, spring } from 'framer-motion';

/**
 * Theme preference: 'light' | 'dark' | 'system'. Dark is the brand default.
 * The resolved theme lives on <html data-theme>. THEME_SCRIPT (inlined in app/layout.js)
 * applies it before first paint and follows the OS while the choice is 'system'.
 */
import { THEME_KEY, DEFAULT_THEME } from './theme-script';

export { THEME_KEY, DEFAULT_THEME };
const EVENT = 'pp:theme';

function readPreference() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function resolve(pref) {
  if (pref !== 'system') return pref;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  const root = document.documentElement;
  // Swap in one frame: without this every element's own colour transition would run at a different speed
  root.classList.add('theme-switching');
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  // Force the new styles before transitions come back on
  void root.offsetHeight;
  root.classList.remove('theme-switching');
}

// The reveal edge is a feathered radial mask whose radius is a registered (animatable) custom property,
// so framer-motion can spring it directly on the view-transition layer. Registered once per page.
const FEATHER = 72;
let registered = false;
function registerRevealProperty() {
  if (registered) return;
  registered = true;
  try {
    CSS.registerProperty({ name: '--theme-reveal', syntax: '<length>', inherits: false, initialValue: '0px' });
  } catch {
    /* already registered (fast refresh) */
  }
}

// Critically damped: no bounce at the edge, a long soft settle at the end.
const REVEAL = { type: spring, visualDuration: 0.85, bounce: 0 };

/**
 * Store and apply a preference. `origin` (the clicked element or a {x, y} point) is where the new
 * theme spreads from. The swap runs as a View Transition animated with framer-motion's animateView:
 * the new theme grows out of the switch behind a soft, feathered edge while the old page dims
 * under it. (No zoom on either layer: inside the feathered band both are visible, so any scale
 * difference shows as doubled text.) Browsers without View Transitions, and people who ask for reduced motion, get an instant swap.
 */
export function setThemePreference(pref, origin) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* not remembered; still applied for this page */
  }
  const announce = () => window.dispatchEvent(new CustomEvent(EVENT, { detail: pref }));

  const root = document.documentElement;
  const theme = resolve(pref);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Same resolved theme (e.g. Dark -> System on a dark OS): nothing to animate
  if (
    root.getAttribute('data-theme') === theme ||
    reduced ||
    typeof document.startViewTransition !== 'function' ||
    typeof CSS === 'undefined' ||
    typeof CSS.registerProperty !== 'function'
  ) {
    applyTheme(theme);
    announce();
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (origin && Number.isFinite(origin.x)) {
    ({ x, y } = origin);
  }
  // Far enough that the feathered edge clears the farthest corner
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + FEATHER;

  registerRevealProperty();
  root.style.setProperty('--theme-reveal-x', `${x}px`);
  root.style.setProperty('--theme-reveal-y', `${y}px`);
  root.classList.add('theme-vt');

  let applied = false;
  const commit = () => {
    if (applied) return;
    applied = true;
    applyTheme(theme);
    announce();
  };
  const cleanup = () => {
    root.classList.remove('theme-vt');
    root.style.removeProperty('--theme-reveal-x');
    root.style.removeProperty('--theme-reveal-y');
  };

  animateView(commit, { interrupt: 'immediate' })
    .new({ '--theme-reveal': ['0px', `${radius}px`] }, REVEAL)
    .old({ filter: ['brightness(1)', 'brightness(0.86)'] }, REVEAL)
    .then((animation) => animation.finished.finally(cleanup), cleanup);

  // A transition only starts once the browser renders a frame. If it stalls (tab in the background,
  // throttled renderer), apply the theme anyway rather than leave the old one on screen.
  setTimeout(() => {
    if (!applied) {
      commit();
      cleanup();
    }
  }, 400);
}

/** Current preference plus a setter; every switch on the page stays in sync. */
export function useThemePreference() {
  const [pref, setPref] = useState(null); // null until mounted: the server cannot know it
  useEffect(() => {
    setPref(readPreference());
    const onChange = (e) => setPref(e.detail ?? readPreference());
    const onStorage = (e) => e.key === THEME_KEY && setPref(readPreference());
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const update = useCallback((next, origin) => setThemePreference(next, origin), []);
  return [pref, update];
}
