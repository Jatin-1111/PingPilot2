// The hero's backdrop: a field of uptime cells, a heartbeat line with one failure on it, and an "x-ray" layer
// underneath that LandingMotion reveals under a spotlight (the cursor on desktop; it rests on the failure otherwise).
//
// Everything is built here on the server from fixed numbers, so server and client render the same markup. Each layer
// is a handful of <path> elements (one per shade), not one node per cell, to keep the DOM small.
//
// Both SVGs share the viewBox and `slice` scaling, so a point in one sits exactly over the same point in the other.
// The failure sits near the horizontal centre so it is still in frame when a phone crops the sides.

const W = 1200
const H = 720
const PITCH = 24 // cell spacing
const CELL = 16 // cell size
const COLS = W / PITCH // 50
const ROWS = H / PITCH // 30

// The failing check: column 27, row 8. High enough to sit clear of the copy at the bottom of the hero.
const FAIL = { col: 27, row: 8 }
const FX = FAIL.col * PITCH + PITCH / 2 // 660
const FY = FAIL.row * PITCH + PITCH / 2 // 204
// Its centre in viewBox units, for LandingMotion to place the spotlight
export const FAIL_X = FX
export const FAIL_Y = FY

// Deterministic 0..1 noise from a cell index (no Math.random: must match on server and client)
function hash(c, r) {
    const s = Math.sin(c * 127.1 + r * 311.7) * 43758.5453
    return s - Math.floor(s)
}

// Soft bands so the field reads as data, not static: denser across the middle, thinning towards the edges
function shade(c, r) {
    const wave = 0.5 + 0.5 * Math.sin(c * 0.21 + r * 0.37) * Math.cos(r * 0.18 - c * 0.07)
    const fade = 1 - Math.abs(r - ROWS * 0.4) / (ROWS * 0.75)
    return Math.max(0, Math.min(1, (wave * 0.7 + hash(c, r) * 0.3) * fade))
}

const cellPath = (c, r) => `M${c * PITCH + 4} ${r * PITCH + 4}h${CELL}v${CELL}h-${CELL}z`

function buildField() {
    const buckets = [[], [], [], []] // faint → strong, all "up"
    const warn = []
    const ticks = [] // x-ray: one latency tick per cell
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = cellPath(c, r)
            const isFail = c === FAIL.col && r === FAIL.row
            if (!isFail) {
                if (hash(c + 7, r + 3) > 0.985) warn.push(p)
                else buckets[Math.min(3, Math.floor(shade(c, r) * 4))].push(p)
            }
            // latency: a vertical tick, taller = slower
            const ms = 0.25 + hash(c + 19, r + 5) * 0.6 + (isFail ? 0.4 : 0)
            const x = c * PITCH + 12
            const y0 = r * PITCH + 20
            ticks.push(`M${x} ${y0}v-${(ms * CELL).toFixed(1)}`)
        }
    }
    return { buckets: buckets.map((b) => b.join('')), warn: warn.join(''), ticks: ticks.join('') }
}

// Heartbeat along the failure's row: nearly flat, one sharp drop where the check failed
function buildPulse() {
    const pts = []
    for (let x = 0; x <= W; x += 12) {
        let y = FY + (hash(x, 3) - 0.5) * 6
        const d = x - FX
        if (d === -12) y = FY - 14
        if (d === 0) y = FY + 46
        if (d === 12) y = FY - 8
        pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`)
    }
    return pts.join(' ')
}

const FIELD = buildField()
const PULSE = buildPulse()
const OPACITY = [0.03, 0.06, 0.1, 0.15]

export default function HeroField() {
    return (
        <div data-hero-backdrop aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            {/* Surface: what a status page shows. Cells are "up"; one is down. */}
            <div data-hero-field className="absolute inset-0">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="size-full">
                    {FIELD.buckets.map((d, i) => (
                        <path key={i} d={d} fill="var(--success)" fillOpacity={OPACITY[i]} />
                    ))}
                    <path d={FIELD.warn} fill="var(--warning)" fillOpacity="0.3" />
                    <path d={cellPath(FAIL.col, FAIL.row)} fill="var(--destructive)" />
                </svg>
            </div>

            {/* X-ray: what Ping Pilott sees underneath. Hidden until the spotlight opens over it. */}
            <div data-hero-xray className="hero-xray absolute inset-0">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="size-full">
                    <defs>
                        <pattern id="hero-xray-grid" width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
                            <rect x="4" y="4" width={CELL} height={CELL} fill="none" stroke="var(--primary)" strokeOpacity="0.28" strokeWidth="0.75" />
                        </pattern>
                    </defs>
                    <rect width={W} height={H} fill="var(--background)" />
                    <rect width={W} height={H} fill="url(#hero-xray-grid)" />
                    <path d={FIELD.ticks} stroke="var(--primary)" strokeWidth="1.25" strokeLinecap="round" />
                    {/* The failed check, drawn as its steps: DNS and connect answered, the secure connection never did */}
                    <rect x={FX - 8} y={FY - 8} width={CELL} height={CELL} fill="none" stroke="var(--destructive)" strokeWidth="1.5" />
                    {/* Caption sits left of the cell, away from the copy column on the right */}
                    <path d={`M${FX - 8} ${FY + 8} L${FX - 40} ${FY + 52} H${FX - 60}`} fill="none" stroke="var(--destructive)" strokeWidth="1" />
                    {/* Plate so the latency ticks never run through the caption */}
                    <rect x={FX - 250} y={FY + 34} width="188" height="54" rx="4" fill="var(--background)" fillOpacity="0.92" />
                    <g fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="0.04em" textAnchor="end">
                        <text x={FX - 66} y={FY + 48} fill="var(--foreground)">status.halden.io</text>
                        <text x={FX - 66} y={FY + 64} fill="var(--success)">DNS 12 ms · Connect 31 ms</text>
                        <text x={FX - 66} y={FY + 80} fill="var(--destructive)">TLS timed out after 30 s</text>
                    </g>
                </svg>
            </div>

            {/* Keeps the copy readable: darkens the top under the nav and the bottom under the headline */}
            <div className="hero-veil absolute inset-0" />

            {/* Heartbeat, the travelling check and the alert. Above the veil so the line stays crisp. */}
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
                {/* Hologram stroke: a coloured line with a pale core, no glow */}
                <g data-hero-pulse fill="none" strokeLinejoin="round" strokeLinecap="round">
                    <path d={PULSE} pathLength="1" stroke="var(--primary)" strokeWidth="2.5" />
                    <path d={PULSE} pathLength="1" stroke="var(--foreground)" strokeOpacity="0.85" strokeWidth="0.8" />
                </g>
                <circle data-hero-dot cx="0" cy={FY} r="5" fill="var(--primary)" opacity="0" />
                {/* Sits left of the cell so a phone, which crops the sides, still shows all of it */}
                <g data-hero-alert style={{ transformOrigin: `${FX - 66}px ${FY - 44}px`, transformBox: 'view-box' }}>
                    <rect x={FX - 170} y={FY - 62} width="208" height="34" rx="17" fill="var(--background)" stroke="var(--destructive)" strokeOpacity="0.6" />
                    <circle cx={FX - 152} cy={FY - 45} r="4" fill="var(--destructive)" />
                    <text x={FX - 140} y={FY - 41} fontFamily="var(--font-geist-sans), sans-serif" fontSize="12" fill="var(--foreground)">
                        status.halden.io is down
                    </text>
                </g>
                {/* Scale labels, like the axes on a chart */}
                <g fontFamily="var(--font-geist-mono), monospace" fontSize="10" letterSpacing="0.14em" fill="var(--muted-foreground)">
                    <text x="28" y={FY - 22}>90 DAYS AGO</text>
                    <text x={W - 28} y={FY - 22} textAnchor="end">NOW</text>
                </g>
            </svg>
        </div>
    )
}
