// Plain module (no 'use client') so the root layout, a server component, can inline the script string.
// The theme preference API for components is in ./theme.js.
export const THEME_KEY = 'pp.theme';
export const DEFAULT_THEME = 'dark';

export const THEME_SCRIPT = `(function(){var k='${THEME_KEY}',d=document.documentElement,m=window.matchMedia('(prefers-color-scheme: light)');function pref(){try{var v=localStorage.getItem(k);return v==='light'||v==='dark'||v==='system'?v:'${DEFAULT_THEME}'}catch(e){return '${DEFAULT_THEME}'}}function apply(){var p=pref(),t=p==='system'?(m.matches?'light':'dark'):p;d.setAttribute('data-theme',t);d.style.colorScheme=t}apply();m.addEventListener('change',function(){if(pref()==='system')apply()});window.addEventListener('storage',function(e){if(e.key===k)apply()})})();`;

