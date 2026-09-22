import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Demo as NavbarDemo } from "@/components/demos/7-navbar-demo";
import { About } from "@/components/sections/about";
import { FinalCta } from "@/components/sections/cta";
import { Events } from "@/components/sections/events";
import { Faq } from "@/components/sections/faq";
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
        {/* 1 — Hero: what IR4ALL is, who backs it, and the robots to play with. */}
        <Hero />

        {/* 2 — The program in eight beats */}
        <Ticker />

        {/* 3 — Two phases, one credential */}
        <Program />

        {/* 4 — Come to the MIX Center (the goal of the page) */}
        <Visit />

        {/* 5 — Arizona robotics events */}
        <Events />

        {/* 6 — Team, funders and partners */}
        <About />

        {/* 7 — Questions */}
        <Faq />

        {/* 8 — Last call */}
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
