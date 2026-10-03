"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] px-5 py-12">
      <section className="panel max-w-lg p-8 text-center">
        <p className="eyebrow text-coral">Dashboard unavailable</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">We couldn’t load your workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">This is usually temporary. Wait a moment, then try again.</p>
        <button type="button" onClick={() => reset()} className="button-primary mt-6">Try again</button>
      </section>
    </main>
  );
}
