import { Lock } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { asset } from "@/lib/asset";
import { PORTAL_LOGIN_URL } from "@/lib/portal";
import { ExpandingStages, type Stage } from "@/components/ui/expanding-stages";

const STAGES: Stage[] = [
  {
    number: "01",
    eyebrow: "Phase 1 · Online · self-paced",
    title: "Learn in the simulator",
    description:
      "A browser-based 3D robot arm, no installation, any device. Learn joint control, Cartesian movement and block programming with an AI Tutor beside you. Four modules, about three hours.",
    chips: ["Blockly programming", "AI Tutor", "4 modules"],
    cta: { label: "Try the arm up top", href: PORTAL_LOGIN_URL },
    image: {
      src: asset("/program/simulator-home.jpg"),
      alt: "A student at their desk at home, on a remote lab session with a robot arm simulator open on a laptop",
    },
  },
  {
    number: "02",
    eyebrow: "Phase 2 · In person · ASU MIX Center",
    title: "Build day at ASU",
    description:
      "Once your modules are done, a two-hour hardware session in Mesa: build and operate a real servo arm, step into the XR lab, then take your final assessment. Pass it and you leave with an official ASU Robotic Arm Fundamentals microcredential, awarded in person and stackable toward future ASU coursework.",
    chips: ["Servo arm build", "Campus XR visit", "ASU microcredential"],
    cta: { label: "Schedule your build day", href: PORTAL_LOGIN_URL },
    image: { src: asset("/program/build-day.jpg"), alt: "Students working with robot arms at a lab table in the ASU MIX Center" },
  },
];

export function Program() {
  return (
    <Section id="program">
      <SectionHeading
        eyebrow="The program"
        title="Two phases"
        description="Learn online at your own pace, then build hands-on at ASU. Finish both and you earn an official ASU microcredential, at no cost. Pick a phase to see what it looks like."
      />
      {/* The prerequisite: Phase 2 is only open to students who have finished Phase 1. */}
      <p className="mx-auto mt-6 flex w-fit max-w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-center text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0 text-brand" />
        <span>
          Complete Phase 1 online first. It unlocks your hands-on Phase 2 visit to ASU.
        </span>
      </p>
      <ExpandingStages stages={STAGES} className="mt-12" />
    </Section>
  );
}
