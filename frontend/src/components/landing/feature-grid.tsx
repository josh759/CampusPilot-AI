import { Icon, type IconName } from "@/components/icon";

const features: { icon: IconName; title: string; description: string; label: string }[] = [
  { icon: "sparkles", title: "AI tutoring", description: "A fresh way to work through tricky concepts, practice what you learn, and find your next study step.", label: "Planned" },
  { icon: "calendar", title: "Assignment tracking", description: "See what is due, what is underway, and where to put your attention. Give every deadline a little breathing room.", label: "Preview in dashboard" },
  { icon: "file", title: "Course documents", description: "A home for lecture notes, syllabi, and study materials. Spend less time searching and more time connecting ideas.", label: "Planned" },
  { icon: "briefcase", title: "Career planning", description: "Connect this semester to your next opportunity. Keep applications and career milestones in view.", label: "Summary preview" },
];

export function FeatureGrid() {
  return (
    <section id="features" aria-labelledby="features-heading" className="border-t border-line bg-white py-16 sm:py-20">
      <div className="page-width">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow text-coral">A little structure goes a long way</p><h2 id="features-heading" className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Your goals. All in one place.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-muted">A look at where we’re headed. Explore sample courses and deadlines in the first dashboard preview.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article key={feature.title} className="flex flex-col rounded-2xl border border-line bg-paper p-6">
              <div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5e7dc] text-coral"><Icon name={feature.icon} className="h-6 w-6" /></span><span className="font-mono text-xs text-muted">0{index + 1}</span></div>
              <h3 className="mt-7 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted">{feature.description}</p>
              <p className="mt-7 border-t border-line pt-4 text-xs font-medium text-muted">{feature.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
