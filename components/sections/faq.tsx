import { Section } from "@/components/section";
import { FaqsSection, type Faq } from "@/components/ui/faqs-1";

const FAQS: Faq[] = [
  {
    id: "who",
    question: "Who can join?",
    answer:
      "Any student at one of the five Tempe Union High School District high schools. Teachers can join too. You do not need any robotics or coding experience.",
  },
  {
    id: "cost",
    question: "How much does it cost?",
    answer:
      "Nothing. IR4All is funded by the APS Foundation and hosted by ASU, so the simulator, the build day at the MIX Center, and your credential are all free.",
  },
  {
    id: "code",
    question: "Do I need to know how to code?",
    answer:
      "No. You program the arm with Blockly, a drag-and-drop block language, and an AI Tutor answers questions as you go. You start with joint control, then Cartesian movement, then blocks.",
  },
  {
    id: "phase1",
    question: "What do I need for Phase 1?",
    answer:
      "A web browser on any device. There is nothing to install. The online course is four modules and takes about three hours, at your own pace.",
  },
  {
    id: "phase2",
    question: "Where and when is Phase 2?",
    answer:
      "At the ASU Media and Immersive eXperience (MIX) Center at Mesa City Center in Mesa, AZ, starting Fall 2026. It is a two-hour hands-on session. Finish the online modules first and scheduling unlocks.",
  },
  {
    id: "credential",
    question: "What do I get at the end?",
    answer:
      "An official ASU Robotic Arm Fundamentals microcredential, awarded in person at the MIX Center. It is stackable, so it can count toward future ASU coursework, plus a certificate of completion for the online course.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <FaqsSection
        title="Questions, answered"
        description="Everything students, parents and teachers ask us before joining."
        faqs={FAQS}
        support={
          <p className="mt-8 text-sm text-muted-foreground">
            Still have a question? Email the IR4All team at{" "}
            <a
              href="mailto:ir4all@asu.edu"
              className="font-medium text-brand underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              ir4all@asu.edu
            </a>
            . Teachers and schools:{" "}
            <a
              href="mailto:ir4all-schools@asu.edu"
              className="font-medium text-brand underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              ir4all-schools@asu.edu
            </a>
            .
          </p>
        }
      />
    </Section>
  );
}
