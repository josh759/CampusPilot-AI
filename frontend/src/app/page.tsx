import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { getAssignments } from "@/lib/db/assignments";
import { getCourses } from "@/lib/db/courses";
import { getDemoUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, courses, assignments] = await Promise.all([getDemoUser(), getCourses(), getAssignments()]);
  const nextDeadline = assignments[0] ? { title: assignments[0].title, dueDate: assignments[0].dueDate.toISOString() } : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Hero courseCount={courses.length} studyHours={user.studyHours} nextDeadline={nextDeadline} />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  );
}
