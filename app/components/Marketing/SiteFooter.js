import { Brand } from '@/components/ui/brand'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import FooterNav from '../Landing Page/FooterNav'

export default function SiteFooter() {
    return (
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
    )
}
