import { ArrowRight, MapPin } from "lucide-react";
import { Section } from "@/components/section";
import { CountUp } from "@/components/ui/count-up";
import { PriceCard } from "@/components/ui/price-card";
import { Reveal } from "@/components/ui/reveal";

const STATS = [
  { value: 100, label: "Students" },
  { value: 12, label: "Teachers" },
  { value: 5, label: "High schools" },
];

/** The message: who it is for, what they get, what it costs. */
export function Intro() {
  return (
    <Section>
      <div className="grid items-center gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Arizona State University · APS Foundation · TUHSD
          </p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl md:text-6xl">
            Robotics for every student. <span className="text-brand">Free.</span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            IR4All gives Tempe Union high schoolers hands-on industrial robotics: a
            browser simulator, a real servo arm build, and an ASU credential. No
            cost. No experience required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#program"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start building
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#visit"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <MapPin className="size-4 text-brand" />
              Visit the lab
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} className="flex min-w-0 flex-col bg-card px-3 py-4 sm:px-5 sm:py-5">
                <dt className="order-2 mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  {stat.label}
                </dt>
                <dd className="order-1 font-[family-name:var(--font-orbitron)] text-2xl font-bold text-brand sm:text-3xl">
                  <CountUp to={stat.value} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>

        {/* The price: ticks up until you hover, then reveals $0. */}
        <PriceCard />
      </div>
    </Section>
  );
}
