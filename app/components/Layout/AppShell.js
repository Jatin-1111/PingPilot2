'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import SideBar from './SideBar';

const STORAGE_KEY = 'pp.sidebar.collapsed';
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const PANE_SELECTOR = '.glass-app :is(.bezel-core, .bezel-sm-core, [data-slot="card"])';

/**
 * Authenticated chrome: floating sidebar + content column.
 * Expanded is the default; the icon rail is an opt-in that is remembered per browser.
 * Pages render inside <main id="main-content"> and own their own max-width and padding
 * through `<PageContainer>` below.
 */
export default function AppShell({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const mainRef = useRef(null);
    // Where the page content started before a toggle, so the layout can change at once and the content slide from there
    const contentLeft = useRef(null);

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
        } catch { /* storage unavailable: stay expanded */ }
    }, []);

    const toggle = () => {
        contentLeft.current = mainRef.current?.firstElementChild?.getBoundingClientRect().left ?? null;
        setCollapsed((c) => {
            const next = !c;
            try {
                localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            } catch { /* ignore */ }
            return next;
        });
    };

    // The sidebar width and the page padding change in one frame (animating them would re-lay-out the whole page every
    // frame). The motion is a transform: the content starts where it was and slides to where it is now, and the
    // sidebar fades in at its new width. Only a toggle animates: the first paint from storage does not.
    useLayoutEffect(() => {
        const before = contentLeft.current;
        contentLeft.current = null;
        const main = mainRef.current;
        const now = main?.firstElementChild?.getBoundingClientRect().left;
        if (before == null || now == null || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const delta = before - now;
        if (Math.abs(delta) > 1) {
            main.animate([{ transform: `translateX(${delta}px)` }, { transform: 'translateX(0)' }], { duration: 250, easing: EASE });
        }
        document.querySelector('aside[aria-label="Main"]')?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180, easing: EASE });
    }, [collapsed]);

    // Dialogs and menus are portalled to <body>, outside this tree. Flag the document while the
    // shell is mounted so globals.css can give them the same glass.
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('glass-app');
        return () => root.classList.remove('glass-app');
    }, []);

    // Spotlight edges: one delegated listener feeds the hovered pane its pointer position
    // (as --mx/--my), batched to one write per frame. Styling lives in globals.css (.app-glass).
    useEffect(() => {
        if (window.matchMedia?.('(hover: none)').matches) return;
        let frame = 0;
        let last = null;
        const onMove = (e) => {
            last = e;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const pane = last.target instanceof Element ? last.target.closest(PANE_SELECTOR) : null;
                if (!pane) return;
                const r = pane.getBoundingClientRect();
                pane.style.setProperty('--mx', `${last.clientX - r.left}px`);
                pane.style.setProperty('--my', `${last.clientY - r.top}px`);
            });
        };
        const onLeave = (e) => {
            const pane = e.target instanceof Element ? e.target.closest(PANE_SELECTOR) : null;
            if (pane && !pane.contains(e.relatedTarget)) {
                pane.style.removeProperty('--mx');
                pane.style.removeProperty('--my');
            }
        };
        document.addEventListener('pointermove', onMove, { passive: true });
        document.addEventListener('pointerout', onLeave, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerout', onLeave);
        };
    }, []);

    return (
        <div className="app-glass min-h-[100dvh]">
            <div className="app-backdrop" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
            </div>
            <SideBar collapsed={collapsed} onToggle={toggle} />
            <main
                ref={mainRef}
                id="main-content"
                className={`min-h-[100dvh] overflow-x-clip ${collapsed ? 'md:pl-[100px]' : 'md:pl-[272px]'}`}
            >
                {children}
            </main>
        </div>
    );
}

/** Standard page body: consistent gutter, max width and vertical rhythm. */
export function PageContainer({ children, className = '' }) {
    return (
        <div className={`mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8 md:py-12 ${className}`}>
            {children}
        </div>
    );
}
