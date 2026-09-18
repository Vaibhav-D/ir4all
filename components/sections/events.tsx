import { ArrowUpRight, Mail } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/ui/reveal";

const EVENTS = [
  {
    month: "Sep",
    year: "2026",
    title: "FIRST LEGO League AZ Season Kickoff",
    where: "ASU Tempe · Memorial Union",
    type: "Workshop",
  },
  {
    month: "Oct",
    year: "2026",
    title: "Arizona VEX Robotics League (Fall)",
    where: "Mesa, AZ · REC Foundation",
    type: "Competition",
  },
  {
    month: "Dec",
    year: "2026",
    title: "Diamond in the Desert – AZ VEX Signature Event",
    where: "Dec 30 · Downtown Mesa, AZ",
    type: "Competition",
  },
  {
    month: "Jan",
    year: "2027",
    title: "Arizona FLL Challenge State Championship",
    where: "ASU West Valley Campus · Phoenix, AZ",
    type: "Championship",
  },
];

const TYPE_STYLES: Record<string, string> = {
  Workshop: "bg-brand/10 text-brand",
  Competition: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Championship: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function Events() {
  return (
    <Section id="events">
      <SectionHeading
        eyebrow="Arizona robotics"
        title="Upcoming events"
        description="Kickoffs, leagues and championships around the Valley. Come meet other builders."
      />

      <ol className="mx-auto mt-14 max-w-3xl space-y-3">
        {EVENTS.map((event, i) => (
          <Reveal key={event.title} delay={i * 0.08}>
            <li className="group flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted text-center leading-none">
                <div>
                  <div className="text-sm font-bold text-brand">
                    {event.month}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{event.year}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.where}</p>
              </div>
              <span
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${TYPE_STYLES[event.type]}`}
              >
                {event.type}
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </li>
          </Reveal>
        ))}
      </ol>

      <p className="mx-auto mt-8 max-w-3xl text-sm text-muted-foreground">
        Want to register, or see more events?{" "}
        <a
          href="mailto:ir4all@asu.edu?subject=IR4All%20events"
          className="inline-flex items-center gap-1 font-medium text-brand underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          <Mail className="size-3.5" />
          Email the team
        </a>{" "}
        and we will get you signed up.
      </p>
    </Section>
  );
}
