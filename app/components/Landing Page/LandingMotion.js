'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { FAIL_X, FAIL_Y } from './HeroField'

gsap.registerPlugin(ScrollTrigger)

// Same curve as --ease-fluid in globals.css: lands slowly, never passes its target.
const LAND = 'expo.out'

/**
 * Motion for the landing page only. Renders nothing; it animates markup tagged with data attributes in page.js and
 * HeroField.js:
 *
 *   [data-hero]             hero <section>; carries data-hero-pending until the intro's start state is set
 *   [data-hero-line]        one line of the headline, inside its own overflow mask
 *   [data-hero-in]          hero copy that fades up after the headline
 *   [data-hero-backdrop]    the whole field; drifts as the hero scrolls away
 *   [data-hero-field]       the uptime cells; open out of the failed cell
 *   [data-hero-xray]        the layer under the spotlight (CSS vars --xx, --xy, --xr)
 *   [data-hero-pulse]       the heartbeat line (draws itself)
 *   [data-hero-dot]         the check travelling along it
 *   [data-hero-alert]       the "is down" pill
 *   [data-reveal="heading"] section heading block; enters from alternating sides
 *   [data-reveal-group]     a list whose [data-reveal-item] children rise in, staggered
 *   [data-reveal-track]     a line that fills as its list scrolls past
 *
 * The hero intro runs about 1.8 s. Every other animation is under 1 s. With prefers-reduced-motion: reduce, nothing
 * moves, Lenis is not started, and the hero is shown finished with the spotlight resting on the failure.
 */
export default function LandingMotion() {
    useEffect(() => {
        const hero = document.querySelector('[data-hero]')
        const mm = gsap.matchMedia()

        mm.add(
            {
                motion: '(prefers-reduced-motion: no-preference)',
                small: '(max-width: 767px)',
                pointer: '(hover: hover) and (pointer: fine)',
            },
            (ctx) => {
                const { motion, small, pointer } = ctx.conditions
                const spot = hero ? setupSpotlight(hero, small) : null

                if (!motion) {
                    // Reduced motion: the finished picture, nothing animates
                    hero?.removeAttribute('data-hero-pending')
                    spot?.rest(true)
                    return () => spot?.destroy()
                }

                // ── Smooth scrolling: Lenis driven by GSAP's ticker so ScrollTrigger reads the same frame ──
                const lenis = new Lenis({ anchors: { offset: -96 } })
                lenis.on('scroll', ScrollTrigger.update)
                const raf = (time) => { lenis.raf(time * 1000) }
                gsap.ticker.add(raf)
                gsap.ticker.lagSmoothing(0)
                ScrollTrigger.config({ ignoreMobileResize: true })

                const shift = small ? 20 : 40 // sideways travel for headings; smaller on phones

                if (hero && spot) introHero(hero, spot, pointer)

                // ── Section headings: big type enters from alternating sides, sharpening as it lands ──
                gsap.utils.toArray('[data-reveal="heading"]').forEach((el, i) => {
                    gsap.from(el, {
                        x: i % 2 ? shift : -shift,
                        opacity: 0,
                        filter: 'blur(6px)',
                        duration: 0.7,
                        ease: LAND,
                        clearProps: 'filter',
                        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
                    })
                })

                // ── Lists and cards: rise in one after another, the whole group done inside 1 s ──
                gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
                    const items = group.querySelectorAll('[data-reveal-item]')
                    const stagger = Math.min(0.08, 0.35 / Math.max(items.length - 1, 1))
                    gsap.from(items, {
                        y: 24,
                        opacity: 0,
                        filter: 'blur(4px)',
                        duration: 0.6,
                        stagger,
                        ease: LAND,
                        clearProps: 'filter',
                        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
                    })
                })

                // ── How it works: a line follows the reader down the steps ──
                gsap.utils.toArray('[data-reveal-track]').forEach((line) => {
                    gsap.fromTo(line, { scaleY: 0 }, {
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: { trigger: line.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
                    })
                })

                return () => {
                    spot.destroy()
                    gsap.ticker.remove(raf)
                    gsap.ticker.lagSmoothing(500, 33)
                    lenis.destroy()
                }
            }
        )

        return () => mm.revert()
    }, [])

    return null
}

/**
 * The x-ray spotlight. It rests on the failed cell; on a mouse or trackpad it follows the pointer while it is over the
 * hero and drifts back to the failure when it leaves. Positions are in px relative to the x-ray layer.
 */
function setupSpotlight(hero, small) {
    const xray = hero.querySelector('[data-hero-xray]')
    const svg = xray.querySelector('svg')
    const radius = small ? 170 : 230
    const toX = gsap.quickTo(xray, '--xx', { duration: 0.5, ease: 'power3.out', unit: 'px' })
    const toY = gsap.quickTo(xray, '--xy', { duration: 0.5, ease: 'power3.out', unit: 'px' })

    // A viewBox point on screen, through the SVG's own `slice` scaling, relative to the x-ray layer
    const toScreen = (vx, vy) => {
        const ctm = svg.getScreenCTM()
        const box = xray.getBoundingClientRect()
        const p = new DOMPoint(vx, vy).matrixTransform(ctm)
        return { x: p.x - box.left, y: p.y - box.top }
    }
    // The failed cell itself (the field opens from here)
    const failPoint = () => toScreen(FAIL_X, FAIL_Y)

    let following = false
    const rest = (instant = false) => {
        // Rest between the cell and its caption so both sit inside the circle
        const { x, y } = toScreen(FAIL_X - 110, FAIL_Y + 38)
        // Phones: no cursor to drive it, and the caption would sit on the copy, so the x-ray stays closed there
        if (instant) gsap.set(xray, { '--xx': `${x}px`, '--xy': `${y}px`, '--xr': small ? '0px' : `${radius}px` })
        else { toX(x); toY(y) }
    }
    const open = (duration = 0.8) => { if (!small) gsap.to(xray, { '--xr': `${radius}px`, duration, ease: LAND }) }

    const onMove = (e) => {
        if (!following) return
        const box = xray.getBoundingClientRect()
        toX(e.clientX - box.left)
        toY(e.clientY - box.top)
    }
    const onLeave = () => following && rest()
    const onResize = () => rest(true)

    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)

    return {
        rest,
        open,
        follow: () => { following = true },
        failPoint,
        destroy: () => {
            hero.removeEventListener('pointermove', onMove)
            hero.removeEventListener('pointerleave', onLeave)
            window.removeEventListener('resize', onResize)
        },
    }
}

/**
 * The hero intro, about 1.8 s. One check carries the story: the field opens out of the failed cell, the check travels
 * the heartbeat line, turns red where the site failed, the alert arrives and the x-ray opens over the failure.
 */
function introHero(hero, spot, pointer) {
    const lines = hero.querySelectorAll('[data-hero-line]')
    const copy = hero.querySelectorAll('[data-hero-in]')
    const field = hero.querySelector('[data-hero-field]')
    const xray = hero.querySelector('[data-hero-xray]')
    const pulse = hero.querySelectorAll('[data-hero-pulse] path')
    const dot = hero.querySelector('[data-hero-dot]')
    const alert = hero.querySelector('[data-hero-alert]')
    const track = pulse[0]
    const total = track.getTotalLength()

    const { x, y } = spot.failPoint()
    const far = Math.hypot(hero.offsetWidth, hero.offsetHeight) * 1.1

    // Start state matches the CSS for [data-hero-pending], so dropping the attribute changes nothing on screen
    // y: 0 clears the CSS start offset, which GSAP would otherwise read as pixels and keep on top of yPercent
    gsap.set(lines, { opacity: 0.15, y: 0, yPercent: 55 })
    gsap.set(copy, { opacity: 0, y: 16 })
    gsap.set(field, { clipPath: `circle(0px at ${x}px ${y}px)` })
    gsap.set(pulse, { strokeDasharray: 1, strokeDashoffset: 1 })
    gsap.set(alert, { opacity: 0, scale: 0.9 })
    gsap.set(xray, { '--xx': `${x}px`, '--xy': `${y}px`, '--xr': '0px' })
    hero.removeAttribute('data-hero-pending')

    // When the check reaches the failed cell: it turns red, the alert arrives, the x-ray opens on the cause
    let failed = false
    const fail = () => {
        failed = true
        dot.setAttribute('fill', 'var(--destructive)')
        gsap.to(alert, { opacity: 1, scale: 1, duration: 0.6, ease: LAND })
        spot.rest()
        spot.open(0.8)
    }

    const tl = gsap.timeline({ defaults: { ease: LAND } })
    tl
        // The headline rises out of its masks, line by line
        .to(lines, { opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.05)
        .to(copy, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.35)
        // The field opens out of the failed cell
        .to(field, { clipPath: `circle(${far}px at ${x}px ${y}px)`, duration: 1.1, clearProps: 'clipPath' }, 0)
        // One check travels the heartbeat, drawing it as it goes
        .set(dot, { opacity: 1 }, 0.2)
        .to(pulse, {
            strokeDashoffset: 0,
            duration: 1.3,
            ease: 'power2.inOut',
            onUpdate() {
                const p = track.getPointAtLength(this.progress() * total)
                dot.setAttribute('cx', p.x)
                dot.setAttribute('cy', p.y)
                if (!failed && p.x >= FAIL_X) fail()
            },
        }, 0.2)
        .to(dot, { opacity: 0, duration: 0.25 }, 1.4)
        .add(() => { if (pointer) spot.follow() })

    // Leaving the hero: the field drifts down behind the copy, the copy moves on a little faster
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } })
        .to(hero.querySelector('[data-hero-backdrop]'), { yPercent: 10, ease: 'none' }, 0)
        .to(hero.querySelector('[data-hero-copy]'), { yPercent: -12, ease: 'none' }, 0)
}
