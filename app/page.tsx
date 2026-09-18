import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Demo as NavbarDemo } from "@/components/demos/7-navbar-demo";
import { About } from "@/components/sections/about";
import { FinalCta } from "@/components/sections/cta";
import { Events } from "@/components/sections/events";
import { Faq } from "@/components/sections/faq";
import { Intro } from "@/components/sections/intro";
import { Program } from "@/components/sections/program";
import { Ticker } from "@/components/sections/ticker";
import { Visit } from "@/components/sections/visit";

export default function Page() {
  return (
    <>
      {/* Navbar — a floating capsule over the page, no backing band. The
          header itself ignores the pointer so the hero stays interactive. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 py-4">
        <NavbarDemo />
      </header>

      <main className="flex-1">
        {/* 1 — Hero, full bleed. Everything the visitor needs to know follows it. */}
        <Hero />

        {/* 2 — The program in eight beats */}
        <Ticker />

        {/* 3 — Who it is for, what they get, what it costs */}
        <Intro />

        {/* 4 — Two phases, one credential */}
        <Program />

        {/* 5 — Come to the MIX Center (the goal of the page) */}
        <Visit />

        {/* 6 — Arizona robotics events */}
        <Events />

        {/* 7 — Team, funders and partners */}
        <About />

        {/* 8 — Questions */}
        <Faq />

        {/* 9 — Last call */}
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
