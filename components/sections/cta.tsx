import { ArrowRight } from "lucide-react";
import { Section } from "@/components/section";
import { PORTAL_LOGIN_URL } from "@/lib/portal";

const SIGNUP_HREF = PORTAL_LOGIN_URL;

/** Last call before the footer. */
export function FinalCta() {
  return (
    <Section divided={false}>
      <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-background md:px-16 md:py-24">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-[family-name:var(--font-orbitron)] text-[24vw] font-black leading-none text-background/[0.06] md:text-[15rem]"
        >
          IR4ALL
        </span>
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Ready to start?</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Your future in robotics starts here.
          </h2>
          <p className="mt-5 text-pretty text-lg text-background/70">
            IR4All is open to all Tempe Union students and teachers at zero cost. Pick
            up the simulator, book your build day at ASU, and start earning toward
            your ASU microcredential.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={SIGNUP_HREF}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Sign up free
              <ArrowRight className="size-4" />
            </a>
            <a
              href={PORTAL_LOGIN_URL}
              className="inline-flex items-center rounded-full border border-background/25 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10"
            >
              See upcoming events
            </a>
          </div>
          <p className="mt-8 text-xs text-background/50">
            Free for all TUHSD students &amp; teachers · Supported by APS Foundation ·
            Hosted by ASU
          </p>
        </div>
      </div>
    </Section>
  );
}
