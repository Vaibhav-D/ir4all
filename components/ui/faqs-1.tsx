"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

const defaultFaqs: Faq[] = [
  {
    id: "item-1",
    question: "What is included in the license?",
    answer:
      "Every purchase includes lifetime access to all current components, future updates, and unlimited use across personal and commercial projects.",
  },
  {
    id: "item-2",
    question: "Do I need to know Tailwind CSS?",
    answer:
      "Basic familiarity helps, but every block ships as copy and paste code with sensible defaults. You can drop a section in and adjust tokens later.",
  },
  {
    id: "item-3",
    question: "Can I use these components in a client project?",
    answer:
      "Yes. You can ship them in unlimited client work. The only restriction is redistributing the components themselves as a competing template or UI kit.",
  },
  {
    id: "item-4",
    question: "How do updates work?",
    answer:
      "New blocks and fixes land continuously. You pull the latest version whenever you need it, and nothing in your existing project breaks.",
  },
  {
    id: "item-5",
    question: "Is there a refund policy?",
    answer:
      "If the library is not a fit, reach out within fourteen days of purchase and you will get a full refund, no questions asked.",
  },
];

export function FaqsSection({
  title = "Frequently asked questions",
  description = "Everything you need to know about the library and how it works.",
  faqs = defaultFaqs,
  support,
}: {
  title?: string;
  description?: string;
  faqs?: Faq[];
  /** Replaces the default support line under the list. */
  support?: React.ReactNode;
}) {
  return (
    <section>
      <div>
        <div className="grid gap-12 md:grid-cols-5 md:gap-16">
          {/* heading column */}
          <div className="md:col-span-2">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-balance text-muted-foreground">{description}</p>
          </div>

          {/* accordion column */}
          <div className="md:col-span-3">
            <Accordion
              type="single"
              collapsible
              className="w-full border-t border-border"
            >
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="group border-b border-border"
                >
                  <AccordionTrigger className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium hover:no-underline [&>svg]:hidden">
                    <span className="transition-colors group-hover:text-brand">
                      {faq.question}
                    </span>
                    <span className="relative flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                      <Plus className="size-4 transition-all duration-300 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0" />
                      <Minus className="absolute size-4 rotate-90 opacity-0 transition-all duration-300 group-data-[state=open]:rotate-0 group-data-[state=open]:opacity-100" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pr-10 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* support call to action */}
            {support ?? (
              <p className="mt-8 text-sm text-muted-foreground">
                Still have a question?{" "}
                <Link
                  href="#"
                  className="font-medium text-brand underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Contact our support team
                </Link>{" "}
                and we will get back to you within one business day.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
