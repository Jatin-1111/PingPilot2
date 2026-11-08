"use client"

import * as React from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { Desktop, Sun, Moon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { useThemePreference } from "@/lib/theme"

// Each icon has its own gesture when it becomes the active choice: the screen hops, the sun turns,
// the moon rocks. Multi-step gestures use timed keyframes (springs only run between two values).
const GESTURE = { duration: 0.6, ease: [0.32, 0.72, 0, 1] }
const OPTIONS = [
  { value: "system", label: "System", icon: Desktop, on: { y: [0, -3, 0], rotate: 0, transition: GESTURE } },
  { value: "light", label: "Light", icon: Sun, on: { rotate: 90, y: 0 } },
  { value: "dark", label: "Dark", icon: Moon, on: { rotate: [0, -26, 10, 0], y: 0, transition: GESTURE } },
]
const PILL = { type: "spring", bounce: 0.22, visualDuration: 0.42 }
const ICON = { type: "spring", bounce: 0.35, visualDuration: 0.5 }

/**
 * Theme picker: System / Light / Dark as a segmented radio group.
 * `labels` shows the words next to the icons (menus); otherwise icons with tooltips.
 * `compact` is a single button that steps through the three, for the collapsed sidebar rail.
 */
function ThemeSwitch({ labels = false, compact = false, className }) {
  const [pref, setPref] = useThemePreference()
  const refs = React.useRef([])
  // Several switches can be on one page (navbar + footer); each needs its own pill
  const pillId = `theme-pill-${React.useId()}`

  if (compact) {
    const i = Math.max(0, OPTIONS.findIndex((o) => o.value === pref))
    const current = OPTIONS[i]
    const next = OPTIONS[(i + 1) % OPTIONS.length]
    const Icon = current.icon
    return (
      <MotionConfig reducedMotion="user">
        <motion.button
          type="button"
          onClick={(e) => setPref(next.value, e.currentTarget)}
          whileTap={{ scale: 0.9 }}
          aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
          title={`Theme: ${current.label}`}
          className={cn(
            "relative grid size-11 place-items-center overflow-hidden rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-tint/[0.06] hover:text-foreground",
            !pref && "invisible",
            className
          )}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current.value}
              className="grid place-items-center"
              initial={{ y: 18, rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
              exit={{ y: -18, rotate: 90, opacity: 0, scale: 0.6 }}
              transition={ICON}>
              <Icon weight="light" className="size-5" />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </MotionConfig>
    )
  }

  const onKeyDown = (e, index) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const n = (index + step + OPTIONS.length) % OPTIONS.length
    setPref(OPTIONS[n].value, refs.current[n])
    refs.current[n]?.focus()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-tint/[0.05] p-1 ring-1 ring-tint/10",
          // Unknown until mounted: hold the space, show nothing, so the wrong option never flashes
          !pref && "invisible",
          className
        )}>
        {OPTIONS.map((o, index) => {
          const active = pref === o.value
          const Icon = o.icon
          return (
            <motion.button
              key={o.value}
              ref={(el) => (refs.current[index] = el)}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (!pref && index === 0) ? 0 : -1}
              onClick={(e) => setPref(o.value, e.currentTarget)}
              onKeyDown={(e) => onKeyDown(e, index)}
              whileTap={{ scale: 0.92 }}
              title={labels ? undefined : o.label}
              className={cn(
                "relative inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] transition-colors duration-300 ease-fluid",
                labels ? "flex-1 px-3" : "w-8",
                active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {active && (
                <motion.span
                  layoutId={pillId}
                  transition={PILL}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-card shadow-[inset_0_1px_0_color-mix(in_oklch,var(--hi)_10%,transparent),0_1px_3px_color-mix(in_oklch,var(--shadow-ink)_25%,transparent)] ring-1 ring-tint/10"
                />
              )}
              <motion.span
                className="relative grid place-items-center"
                initial={false}
                animate={active ? o.on : { rotate: 0, y: 0 }}
                transition={ICON}>
                <Icon weight={active ? "regular" : "light"} className="size-4" />
              </motion.span>
              <span className={labels ? "relative" : "sr-only"}>{o.label}</span>
            </motion.button>
          )
        })}
      </div>
    </MotionConfig>
  )
}

export { ThemeSwitch }
