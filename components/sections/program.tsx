import { Section, SectionHeading } from "@/components/section";
import { asset } from "@/lib/asset";
import { ExpandingStages, type Stage } from "@/components/ui/expanding-stages";

const STAGES: Stage[] = [
  {
    number: "01",
    eyebrow: "Phase 1 · Online · self-paced",
    title: "Learn in the simulator",
    description:
      "A browser-based 3D robot arm, no installation, any device. Learn joint control, Cartesian movement and block programming with an AI Tutor beside you. Four modules, about three hours.",
    chips: ["Blockly programming", "AI Tutor", "4 modules"],
    cta: { label: "Try the arm up top", href: "#" },
    image: { src: asset("/program/simulator.jpg"), alt: "A student at home driving the robot arm simulator on a laptop" },
  },
  {
    number: "02",
    eyebrow: "Phase 2 · In person · ASU MIX Center",
    title: "Build day at ASU",
    description:
      "Once your modules are done, a two-hour hardware session in Mesa: build and operate a real servo arm, step into the XR lab, then take your final assessment.",
    chips: ["Servo arm build", "Campus XR visit", "2-hour session"],
    cta: { label: "Schedule your build day", href: "#visit" },
    image: { src: asset("/program/build-day.jpg"), alt: "Students working with robot arms at a lab table in the ASU MIX Center" },
  },
  {
    number: "03",
    eyebrow: "Credential · Issued by ASU",
    title: "Earn your credential",
    description:
      "Your official ASU Robotic Arm Fundamentals microcredential, awarded in person at the MIX Center. It is stackable toward future ASU coursework, and it costs you nothing.",
    chips: ["ASU microcredential", "Awarded in person", "Stackable"],
    cta: { label: "What's included", href: "#faq" },
    image: { src: asset("/program/credential.jpg"), alt: "An instructor handing a student their certificate beside a robot arm" },
  },
];

export function Program() {
  return (
    <Section id="program">
      <SectionHeading
        eyebrow="The program"
        title="Two phases. One credential."
        description="Learn online at your own pace, then build hands-on at ASU and earn your ASU microcredential. Pick a stage to see what it looks like."
      />
      <ExpandingStages stages={STAGES} className="mt-14" />
    </Section>
  );
}
