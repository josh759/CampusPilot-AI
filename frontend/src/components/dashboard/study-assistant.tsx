import { Icon } from "@/components/icon";

const studyPlanTitle = "25 minutes of abstract algebra";
const studyPlan = [
  { duration: "5 min", task: "Recall the definitions of a group and a subgroup without your notes." },
  { duration: "15 min", task: "Apply the subgroup test to two examples from your lecture notes." },
  { duration: "5 min", task: "Write down one question to bring to your next algebra lecture." },
];

export function StudyAssistant() {
  return (
    <section id="study-assistant" aria-labelledby="assistant-heading" className="rounded-2xl bg-ink p-6 text-white">
      <div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f1b28d]"><Icon name="sparkles" /></span><span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-slate-200">AI · Coming soon</span></div>
      <h2 id="assistant-heading" className="mt-5 text-xl font-semibold tracking-tight">Make your next study<br />session count.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">Your future AI study assistant will help break big topics into manageable steps. Start with a sample plan for today.</p>
      <details className="mt-5">
        <summary className="rounded-xl bg-[#f1b28d] px-4 py-3 text-sm font-semibold text-ink hover:bg-[#f6c4a6]">Explore a study plan</summary>
        <div className="mt-5 border-t border-white/20 pt-5">
          <h3 className="text-sm font-semibold">{studyPlanTitle}</h3><p className="mt-2 text-xs leading-5 text-slate-300">Prewritten example, not an AI-generated response.</p>
          <ol className="mt-4 space-y-4">{studyPlan.map((step, index) => <li key={step.task} className="flex gap-3 text-xs leading-5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f1b28d]">{index + 1}</span><p><span className="font-semibold text-[#f1b28d]">{step.duration}</span><br />{step.task}</p></li>)}</ol>
        </div>
      </details>
    </section>
  );
}
