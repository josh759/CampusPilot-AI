import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { SiteFooter, SiteHeader } from "@/components/landing/site-chrome";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Hero courseCount={3} studyHours={6} />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  );
}
