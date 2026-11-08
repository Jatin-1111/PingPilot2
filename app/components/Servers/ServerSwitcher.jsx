'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { StatusDot } from '@/components/ui/status';
import { displayUrl } from '@/lib/time';
import { cn } from '@/lib/utils';
import { countByStatus, filterAndSort, statusOf } from '@/lib/server-list';

const idOf = (s) => s._id || s.id;

const FILTERS = [
    ['all', 'All'],
    ['down', 'Down'],
    ['up', 'Up'],
    ['unknown', 'Pending'],
];
const GROUPS = { down: 'Needs attention', unknown: 'Waiting for first check', up: 'Operational' };

const EASE = [0.32, 0.72, 0, 1];

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

/**
 * Server switcher for accounts with many monitors. A button shows the server you are viewing; it opens a search-first
 * overlay (also on Ctrl/⌘ + K) with status filters, problems grouped on top and full keyboard control: type to narrow,
 * ↑ ↓ to move, Enter to open, Esc to close. Focus stays in the search box (combobox pattern).
 */
export default function ServerSwitcher({ servers, selected, onSelect, className }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [sort, setSort] = useState('problems');
    const [active, setActive] = useState(0);
    const [host, setHost] = useState(null);
    const [mac, setMac] = useState(false);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();
    const reduce = useReducedMotion();

    useEffect(() => {
        setHost(document.body);
        setMac(isMac());
    }, []);

    const openPicker = () => {
        const sorted = filterAndSort(servers, { sort });
        const at = selected ? sorted.findIndex((x) => idOf(x) === idOf(selected)) : -1;
        setQuery('');
        setStatus('all');
        setActive(Math.max(0, at));
        setOpen(true);
    };
    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    // Ctrl/⌘ + K opens it from anywhere on the page
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (!open) openPicker();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, servers, selected, sort]);

    // Lock page scroll and put the cursor in the search box while open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        inputRef.current?.focus();
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const counts = useMemo(() => countByStatus(servers), [servers]);
    const listed = useMemo(() => filterAndSort(servers, { query, status, sort }), [servers, query, status, sort]);
    const current = Math.min(active, Math.max(0, listed.length - 1));

    // Headings split the list into "needs attention" and the rest, but only while it is in problems-first order
    const rows = useMemo(() => {
        if (sort !== 'problems') return listed.map((server) => ({ server }));
        const tally = { down: 0, unknown: 0, up: 0 };
        listed.forEach((x) => { tally[statusOf(x)] += 1; });
        const out = [];
        let last = null;
        listed.forEach((server) => {
            const st = statusOf(server);
            if (st !== last) {
                out.push({ heading: GROUPS[st], count: tally[st], key: st });
                last = st;
            }
            out.push({ server });
        });
        return out;
    }, [listed, sort]);

    // Keep the highlighted row in view
    useEffect(() => {
        if (!open || !listed[current]) return;
        document.getElementById(`${listId}-${idOf(listed[current])}`)?.scrollIntoView({ block: 'nearest' });
    }, [open, current, listed, listId]);

    const choose = (server) => {
        if (!server) return;
        if (!selected || idOf(server) !== idOf(selected)) onSelect(server);
        close();
    };

    const move = (to) => setActive(Math.min(listed.length - 1, Math.max(0, to)));

    const onKeyDown = (e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            move(current + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            move(current - 1);
        } else if (e.key === 'PageDown') {
            e.preventDefault();
            move(current + 8);
        } else if (e.key === 'PageUp') {
            e.preventDefault();
            move(current - 8);
        } else if (e.key === 'Home' && e.target === inputRef.current && e.ctrlKey) {
            e.preventDefault();
            move(0);
        } else if (e.key === 'End' && e.target === inputRef.current && e.ctrlKey) {
            e.preventDefault();
            move(listed.length - 1);
        } else if (e.key === 'Enter' && e.target === inputRef.current) {
            e.preventDefault();
            choose(listed[current]);
        } else if (e.key === 'Tab' && panelRef.current) {
            const f = panelRef.current.querySelectorAll(FOCUSABLE);
            if (!f.length) return;
            const first = f[0];
            const last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    const filtered = query.trim() !== '' || status !== 'all';
    const activeId = listed[current] ? `${listId}-${idOf(listed[current])}` : undefined;

    const overlay = open && (
        <motion.div
            key="switcher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
            className="fixed inset-0 flex items-start justify-center bg-shade/60 p-3 pt-[8vh] backdrop-blur-sm sm:p-6 sm:pt-[12vh]"
            style={{ zIndex: 'var(--z-modal)' }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
            <motion.div
                ref={panelRef}
                initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                role="dialog"
                aria-modal="true"
                aria-label="Switch server"
                onKeyDown={onKeyDown}
                className="flex max-h-[min(40rem,82dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-background/95 shadow-2xl ring-1 ring-tint/[0.12] backdrop-blur-xl"
            >
                <div className="flex items-center gap-3 border-b border-tint/[0.07] px-5">
                    <MagnifyingGlass weight="light" aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        aria-activedescendant={activeId}
                        aria-autocomplete="list"
                        aria-label="Find a server by name or address"
                        placeholder="Find a server by name or address"
                        autoComplete="off"
                        spellCheck={false}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                        className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />
                    <kbd className="hidden rounded-md px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-tint/[0.1] sm:inline">Esc</kbd>
                </div>

                <div className="flex flex-wrap gap-1.5 border-b border-tint/[0.07] px-4 py-3" role="group" aria-label="Show servers by status">
                    {FILTERS.filter(([key]) => key === 'all' || counts[key] > 0 || status === key).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={status === key}
                            onClick={() => { setStatus(key); setActive(0); inputRef.current?.focus(); }}
                            className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium tabular-nums ring-1 transition-colors duration-300 ease-fluid',
                                status === key
                                    ? 'bg-primary/15 text-foreground ring-primary/50'
                                    : 'text-muted-foreground ring-tint/[0.1] hover:bg-tint/[0.06] hover:text-foreground',
                                key === 'down' && counts.down > 0 && status !== key && 'text-destructive'
                            )}
                        >
                            {label}
                            <span className="font-mono">{counts[key]}</span>
                        </button>
                    ))}
                </div>

                <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label="Servers"
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pt-9 p-2"
                >
                    {rows.map((row) => {
                        if (row.heading) {
                            return (
                                <li
                                    key={`h-${row.key}`}
                                    role="presentation"
                                    className="sticky top-0 z-10 flex items-center justify-between bg-background/95 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground first:pt-1"
                                >
                                    <span>{row.heading}</span>
                                    <span className="font-mono tabular-nums">{row.count}</span>
                                </li>
                            );
                        }
                        const server = row.server;
                        const st = statusOf(server);
                        const isCurrent = selected && idOf(server) === idOf(selected);
                        const isActive = listed[current] && idOf(listed[current]) === idOf(server);
                        return (
                            <li
                                key={idOf(server)}
                                id={`${listId}-${idOf(server)}`}
                                role="option"
                                aria-selected={isActive}
                                onMouseMove={() => { if (!isActive) setActive(listed.indexOf(server)); }}
                                onClick={() => choose(server)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150',
                                    isActive && 'bg-tint/[0.07]',
                                    isCurrent && 'ring-1 ring-primary/50'
                                )}
                            >
                                <StatusDot status={server.status} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                        {server.name}
                                        {isCurrent && <span className="ml-2 text-xs font-normal text-muted-foreground">Viewing</span>}
                                    </span>
                                    <span className="block truncate font-mono text-xs text-muted-foreground">{displayUrl(server.url)}</span>
                                </span>
                                <span className={cn('shrink-0 font-mono text-xs tabular-nums', st === 'down' ? 'text-destructive' : 'text-muted-foreground')}>
                                    {st === 'down' ? 'Down' : st === 'unknown' ? 'Pending' : server.responseTime ? `${server.responseTime} ms` : '—'}
                                </span>
                                <span className="sr-only">{st === 'up' ? 'Operational' : st === 'down' ? 'Down' : 'Pending'}</span>
                            </li>
                        );
                    })}
                    {listed.length === 0 && (
                        <li role="presentation" className="px-3 py-10 text-center text-sm text-muted-foreground">
                            <p>No servers match{query.trim() ? ` “${query.trim()}”` : ''}.</p>
                            {filtered && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(''); setStatus('all'); inputRef.current?.focus(); }}
                                    className="mt-3 rounded-full px-4 py-1.5 text-xs font-medium text-foreground ring-1 ring-tint/[0.15] transition-colors duration-300 ease-fluid hover:bg-tint/[0.06]"
                                >
                                    Clear search and filters
                                </button>
                            )}
                        </li>
                    )}
                </ul>

                <div className="flex items-center justify-between gap-3 border-t border-tint/[0.07] px-4 py-2.5 text-xs text-muted-foreground">
                    <span role="status" aria-live="polite" className="tabular-nums">
                        {filtered ? `${listed.length} of ${servers.length}` : `${servers.length} ${servers.length === 1 ? 'server' : 'servers'}`}
                    </span>
                    <span className="hidden items-center gap-3 sm:flex" aria-hidden="true">
                        <span><kbd className="font-mono">↑↓</kbd> move</span>
                        <span><kbd className="font-mono">↵</kbd> open</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => { setSort(sort === 'problems' ? 'name' : 'problems'); setActive(0); inputRef.current?.focus(); }}
                        className="rounded-md px-1.5 py-1 transition-colors duration-300 ease-fluid hover:bg-tint/[0.06] hover:text-foreground"
                    >
                        Sort: {sort === 'problems' ? 'problems first' : 'A–Z'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={openPicker}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={cn(
                    'group inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full bg-tint/[0.03] pl-4 pr-2 text-sm font-medium text-foreground ring-1 ring-tint/12 outline-none transition-[transform,background-color,box-shadow] duration-500 ease-fluid hover:bg-tint/[0.07] hover:ring-tint/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring',
                    className
                )}
            >
                <MagnifyingGlass weight="light" aria-hidden="true" className="size-[1.1em]" />
                Switch server
                <kbd className="hidden rounded-full bg-shade/15 px-2 py-0.5 font-mono text-[11px] font-normal text-muted-foreground sm:inline" aria-hidden="true">
                    {mac ? '⌘K' : 'Ctrl K'}
                </kbd>
                <span className="sr-only">, {servers.length} {servers.length === 1 ? 'server' : 'servers'}{selected ? `, viewing ${selected.name}` : ''}</span>
            </button>
            {host ? createPortal(<AnimatePresence>{overlay}</AnimatePresence>, host) : null}
        </>
    );
}
