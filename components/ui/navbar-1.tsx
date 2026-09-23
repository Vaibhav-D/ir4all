"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PORTAL_LOGIN_URL } from "@/lib/portal";

/** Hex-cut badge with a circuit-trace "4": the IR4ALL mark. */
export function Ir4allMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M16 1.5 28.5 8.75v14.5L16 30.5 3.5 23.25V8.75L16 1.5Z"
        className="fill-foreground"
      />
      <path
        d="M16 4.6 25.8 10.3v11.4L16 27.4 6.2 21.7V10.3L16 4.6Z"
        className="stroke-background/25"
        strokeWidth="0.75"
      />
      <path
        d="M18.5 8 10 18.75h11.5M18.5 8v16"
        stroke="#ff6a13"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="18.5" cy="24" r="1.6" className="fill-background" stroke="#ff6a13" strokeWidth="1.2" />
      <circle cx="10" cy="18.75" r="1.6" className="fill-background" stroke="#ff6a13" strokeWidth="1.2" />
      <path d="M21.5 18.75h3" stroke="#ff6a13" strokeWidth="1.2" strokeDasharray="1 1" />
    </svg>
  );
}

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "How it works", href: "#program" },
    { name: "Events", href: "#events" },
    { name: "Visit", href: "#visit" },
    { name: "About", href: "#about" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <div className="flex w-full justify-center">
      <div className="pointer-events-auto relative z-10 flex w-full max-w-4xl items-center justify-between gap-6 rounded-full border border-border bg-card py-2.5 pl-6 pr-3 shadow-lg">
        <div className="flex items-center">
          <motion.a
            href="#"
            aria-label="IR4ALL home"
            className="group mr-4 flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Ir4allMark className="h-8 w-8" />
            <span className="font-[family-name:var(--font-orbitron)] text-base font-bold tracking-[0.18em] text-foreground">
              IR<span className="text-[#ff6a13]">4</span>ALL
            </span>
          </motion.a>
        </div>

        {/* desktop navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <a
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </a>
            </motion.div>
          ))}
        </nav>

        {/* desktop call to action */}
        <motion.div
          className="hidden items-center gap-2.5 md:flex"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <a
            href={PORTAL_LOGIN_URL}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Book a build day
          </a>
          <ThemeToggle />
        </motion.div>

        {/* mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
        <motion.button
          className="flex items-center"
          onClick={toggleMenu}
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </motion.button>
        </div>
      </div>

      {/* mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 bg-background px-6 pt-24 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-foreground" />
            </motion.button>

            <div className="flex flex-col space-y-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.3 }}
                >
                  <a
                    href={link.href}
                    className="text-base font-medium text-foreground"
                    onClick={toggleMenu}
                  >
                    {link.name}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="pt-6"
              >
                <a
                  href={PORTAL_LOGIN_URL}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  onClick={toggleMenu}
                >
                  Book a build day
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Navbar1 };
