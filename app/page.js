import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowDown, DeviceMobile } from '@phosphor-icons/react/dist/ssr'
import Navbar from './components/Landing Page/Navbar'
import HeroField from './components/Landing Page/HeroField'
import FeatureBento from './components/Landing Page/FeatureBento'
import PricingSection from './components/Landing Page/PricingSection'
import FooterNav from './components/Landing Page/FooterNav'
import LandingMotion from './components/Landing Page/LandingMotion'
import { Brand } from '@/components/ui/brand'
import { Button, ButtonArrow } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { pageMetadata, faqSchema } from '@/lib/seo'

// The headline, one entry per line: each line rises out of its own mask in the intro
const HEADLINE = ["Know it's down", 'before your', 'customers do.']

const STEPS = [
    {
        n: '01',
        title: 'Add a URL',
        body: 'Paste the address of a website or server, give it a name, and choose how often to check it.',
    },
    {
        n: '02',
        title: 'We check it on schedule',
        body: 'Ping Pilott requests the URL from our servers and records whether it answered and how long it took.',
    },
    {
        n: '03',
        title: 'Get alerted, then look back',
        body: 'A failed check sends you an alert. The dashboard keeps status, response times and every incident in one place.',
    },
]

export const metadata = pageMetadata({
    path: '/',
    title: { absolute: 'Website Uptime Monitoring & Server Monitoring Tool | Ping Pilott' },
    ogTitle: 'Ping Pilott: website uptime monitoring with instant downtime alerts',
    description:
        'Monitor website and server uptime with checks as often as every minute, instant alerts by email, Slack, Discord and Telegram, a diagnosis of why a check failed, public status pages and CPU, memory and disk metrics. Free plan, no expiry.',
})

const MORE = [
    {
        href: '/public-status-page',
        title: 'Public status page',
        body: 'Give customers a page that shows what is up, the last 30 days and recent incidents. One on every plan, up to 10 on Business.',
    },
    {
        href: '/server-resource-monitoring',
        title: 'CPU, memory and disk',
        body: 'Install the small host agent and see whether the machine ran out of resources when a check failed. On Starter, Pro and Business.',
    },
    {
        href: '/docs/failures',
        title: 'Why it failed',
        body: 'Each failed check shows the step that broke (DNS, connect, TLS, response, content) with the likely causes and what to check first.',
    },
]

const FAQS = [
    { q: 'What is Ping Pilott?', a: 'Ping Pilott is an uptime monitor for websites, APIs, TCP ports and databases. It checks them on a schedule from outside your network, alerts you when one stops answering, and records response times and every incident.' },
    { q: 'Is there a free plan?', a: 'Yes. The free plan never expires and covers 5 URLs checked every 5 minutes, with alerts by email, Slack, Discord and Telegram, and one public status page.' },
    { q: 'Does Ping Pilott tell me why a site is down?', a: 'It shows which step of the check failed (name lookup, connection, secure connection, response or page content) and the usual cause. Paid plans add the likely causes with evidence, a checklist of what to check, and what the server answered.' },
    { q: 'Can I show customers a status page?', a: 'Yes. A public status page lists the monitors you choose with 30 days of history and recent incidents. Free and Starter include one page, Pro three and Business ten. Search engines are told not to list it unless you turn that on.' },
    { q: 'Can it monitor CPU, memory and disk?', a: 'Yes, with the host agent, a small program you install on the server. It reports CPU, memory, disk and network once a minute and can alert you when they stay high. Host metrics are on Starter (3 servers), Pro (15) and Business (60).' },
    { q: 'Is there a mobile app?', a: 'There is an Android app that sends alerts to your phone, with Check now and Snooze buttons. There is no iPhone app yet; alerts still arrive by email there.' },
]

const JSON_LD = {
    '@context': 'https://schema.org',
    '@graph': [
        { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png` },
        { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: SITE_NAME, url: SITE_URL, publisher: { '@id': `${SITE_URL}/#org` } },
        {
            '@type': 'SoftwareApplication',
            name: SITE_NAME,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            description: 'Website and server uptime monitoring with scheduled checks, alerts by email, Slack, Discord and Telegram, failure diagnosis, public status pages, host metrics and incident history.',
            url: SITE_URL,
            featureList: [
                'Website, API, TCP port and database monitoring',
                'Checks as often as every minute',
                'Alerts by email, Slack, Discord, Telegram and webhook',
                'Response-time tracking and slow-response alerts',
                'Failure diagnosis showing the step that failed',
                'Page content (keyword) checks and certificate expiry alerts',
                'Public status pages',
                'CPU, memory and disk metrics through a host agent',
                'Incident history',
                'Android app',
            ],
            offers: [
                { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Starter', price: '10', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Business', price: '79', priceCurrency: 'USD' },
            ],
        },
        faqSchema(FAQS),
    ],
}

export default function LandingPage() {
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
            <Navbar />
            <LandingMotion />

            {/* overflow-x-clip: headings slide in from the sides and must not widen the page on phones */}
            <main id="main-content" className="overflow-x-clip">
                {/* Hero: full-screen field of uptime cells, headline pinned to the bottom (see HeroField) */}
                <section
                    data-hero
                    data-hero-pending=""
                    className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-4 pb-10 pt-[18.5rem] sm:px-8 md:pb-14 md:pt-32"
                >
                    {/* Without JavaScript the intro never plays, so show the hero as it is */}
                    <noscript>
                        <style>{'[data-hero-pending] [data-hero-line],[data-hero-pending] [data-hero-in],[data-hero-pending] [data-hero-alert]{opacity:1!important;transform:none!important}[data-hero-pending] [data-hero-field]{clip-path:none!important}[data-hero-pending] [data-hero-pulse] path{stroke-dashoffset:0!important}'}</style>
                    </noscript>
                    <HeroField />

                    <div data-hero-copy className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-10">
                        <div className="space-y-6 lg:col-span-8">
                            <div data-hero-in className="flex flex-wrap items-center gap-3">
                                <span className="eyebrow">Website uptime monitoring</span>
                                <Link
                                    href="/android-app"
                                    className="inline-flex items-center gap-2 rounded-full bg-tint/[0.04] px-3 py-1 text-[12px] text-muted-foreground ring-1 ring-tint/10 backdrop-blur-sm transition-colors duration-300 ease-fluid hover:bg-tint/[0.07] hover:text-foreground"
                                >
                                    <DeviceMobile weight="light" className="size-3.5 text-primary" />
                                    New: Android alerts
                                </Link>
                            </div>
                            {/* One masked line per row: each rises out of its own slot */}
                            <h1 className="font-display text-[clamp(2.9rem,8.2vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.045em]">
                                {HEADLINE.map((line, i) => (
                                    <Fragment key={line}>
                                        <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                                            <span data-hero-line className="block">{line}</span>
                                        </span>
                                        {i < HEADLINE.length - 1 && <span className="sr-only"> </span>}
                                    </Fragment>
                                ))}
                            </h1>
                        </div>

                        <div className="space-y-6 lg:col-span-4 lg:pb-3">
                            <p data-hero-in className="max-w-[44ch] text-base leading-relaxed text-muted-foreground md:text-lg">
                                Ping Pilott is a website and server uptime monitor. It checks your URLs as often as every minute, alerts you the moment a site goes down, and shows which step of the check failed.
                            </p>
                            <div data-hero-in className="flex flex-wrap items-center gap-3">
                                <Button asChild size="lg">
                                    <Link href="/auth?mode=signup">
                                        Start free
                                        <ButtonArrow />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="ghost">
                                    <a href="#pricing">
                                        See pricing
                                        <ArrowDown weight="light" />
                                    </a>
                                </Button>
                            </div>
                            <p data-hero-in className="text-[13px] text-muted-foreground">Free forever. 5 URLs, checked every 5 minutes.</p>
                        </div>
                    </div>
                </section>

                {/* Features: asymmetric bento */}
                <section id="features" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <div data-reveal="heading" className="mb-14 max-w-xl space-y-5">
                            <span className="eyebrow">What you get</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                Website and server monitoring, without the setup.
                            </h2>
                        </div>
                        <FeatureBento />
                    </div>
                </section>

                {/* Beyond uptime checks: links to the deeper pages */}
                <section className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <div data-reveal="heading" className="mb-12 max-w-xl space-y-5">
                            <span className="eyebrow">More than a ping</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                Find out why, and tell your customers.
                            </h2>
                        </div>
                        <ul data-reveal-group className="grid gap-5 md:grid-cols-3">
                            {MORE.map((m) => (
                                <li data-reveal-item key={m.href}>
                                    <Link href={m.href} className="block h-full rounded-2xl bg-tint/[0.03] p-7 ring-1 ring-tint/[0.07] transition-colors duration-300 ease-fluid hover:bg-tint/[0.06]">
                                        <h3 className="font-display text-2xl font-medium tracking-tight">{m.title}</h3>
                                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* How it works: sticky title, stepped list */}
                <section id="how" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
                        <div className="md:sticky md:top-32 md:self-start">
                            <div data-reveal="heading" className="space-y-5">
                                <span className="eyebrow">How it works</span>
                                <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                    Three steps to a quiet pager.
                                </h2>
                            </div>
                        </div>
                        <ol data-reveal-group className="relative divide-y divide-tint/[0.07] border-y border-tint/[0.07]">
                            {/* Fills as the steps scroll past, like a check travelling down the list */}
                            <span
                                data-reveal-track
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-px top-0 h-full w-px origin-top bg-primary/60 motion-reduce:hidden"
                                style={{ transform: 'scaleY(0)' }}
                            />
                            {STEPS.map((s) => (
                                <li data-reveal-item key={s.n} className="grid grid-cols-[3.5rem_1fr] gap-4 py-9 md:grid-cols-[5rem_1fr]">
                                    <span className="font-mono text-sm tabular-nums text-primary">{s.n}</span>
                                    <div className="space-y-2.5">
                                        <h3 className="font-display text-2xl font-medium tracking-tight">{s.title}</h3>
                                        <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <PricingSection />

                <section id="faq" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <div data-reveal="heading" className="mb-12 max-w-xl space-y-5">
                            <span className="eyebrow">FAQ</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">Common questions.</h2>
                        </div>
                        <dl data-reveal-group className="divide-y divide-tint/[0.07] border-y border-tint/[0.07]">
                            {FAQS.map((f) => (
                                <div data-reveal-item key={f.q} className="grid gap-3 py-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
                                    <dt className="font-display text-xl font-medium tracking-tight">{f.q}</dt>
                                    <dd className="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* Closing call to action */}
                <section className="px-4 pb-20 pt-8 sm:px-8 md:pb-28">
                    <div data-reveal-group className="mx-auto max-w-6xl">
                        <div data-reveal-item className="bezel">
                            <div className="bezel-core relative overflow-hidden px-7 py-16 text-center sm:px-12 md:py-24">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        background:
                                            'radial-gradient(36rem 18rem at 50% 0%, var(--hero-glow), transparent 70%)',
                                    }}
                                />
                                <div className="relative mx-auto max-w-2xl space-y-7">
                                    <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                        Add your first monitor today.
                                    </h2>
                                    <p className="mx-auto max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                                        Start free, paste a URL, and Ping Pilott starts checking it right away.
                                    </p>
                                    <Button asChild size="lg">
                                        <Link href="/auth?mode=signup">
                                            Start free
                                            <ButtonArrow />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-auto border-t border-tint/[0.07] px-4 py-12 sm:px-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-xs space-y-4">
                        <Brand />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Uptime monitoring for websites and servers.
                        </p>
                    </div>
                    <FooterNav />
                </div>
                <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} Ping Pilott</p>
                    <ThemeSwitch />
                </div>
            </footer>
        </div>
    )
}
