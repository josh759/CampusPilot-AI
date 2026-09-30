import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="page-width flex min-h-24 flex-wrap items-center justify-between gap-4 py-5">
        <Brand />
        <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-8">
          <Link href="/#features" className="rounded text-sm font-medium text-muted hover:text-ink">Features</Link>
          <Link href="/dashboard" className="button-primary">Open Dashboard <Icon name="arrow" className="hidden h-4 w-4 sm:block" /></Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="page-width flex flex-col gap-7 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div><Brand /><p className="mt-3 text-sm text-muted">A little more clarity. A lot more possibility.</p></div>
        <div className="space-y-3 text-sm text-muted sm:text-right">
          <nav aria-label="Footer navigation" className="flex gap-6 sm:justify-end">
            <Link href="/#features" className="rounded hover:text-ink">Features</Link>
            <Link href="/dashboard" className="rounded hover:text-ink">Demo dashboard</Link>
          </nav>
          <p>© 2026 CampusPilot AI. Built for what comes next.</p>
        </div>
      </div>
    </footer>
  );
}
