"use client";

import { Plus } from "lucide-react";

type Logo = {
  name: string;
  src: string;
};

const logos: Logo[] = [
  { name: "Vercel", src: "https://cdn.simpleicons.org/vercel" },
  { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs" },
  { name: "React", src: "https://cdn.simpleicons.org/react" },
  { name: "Tailwind CSS", src: "https://cdn.simpleicons.org/tailwindcss" },
  { name: "Figma", src: "https://cdn.simpleicons.org/figma" },
  { name: "GitHub", src: "https://cdn.simpleicons.org/github" },
  { name: "Stripe", src: "https://cdn.simpleicons.org/stripe" },
  { name: "Supabase", src: "https://cdn.simpleicons.org/supabase" },
];

const COLUMNS = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-3 md:grid-cols-4",
} as const;

/** The bordered grid with plus marks at its corners; cells are up to the caller. */
export function LogoFrame({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: keyof typeof COLUMNS;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* decorative plus icons at the four corners of the frame */}
      <Plus
        aria-hidden
        className="absolute -top-3 -left-3 size-6 stroke-1 text-muted-foreground/60"
      />
      <Plus
        aria-hidden
        className="absolute -top-3 -right-3 size-6 stroke-1 text-muted-foreground/60"
      />
      <Plus
        aria-hidden
        className="absolute -bottom-3 -left-3 size-6 stroke-1 text-muted-foreground/60"
      />
      <Plus
        aria-hidden
        className="absolute -bottom-3 -right-3 size-6 stroke-1 text-muted-foreground/60"
      />

      {/* hairline grid: gap-px over a border-colored surface renders the dividers */}
      <div className={`grid grid-cols-2 gap-px border border-border bg-border ${COLUMNS[columns]}`}>
        {children}
      </div>
    </div>
  );
}

export function LogoCloud({ className }: { className?: string }) {
  return (
    <LogoFrame className={className}>
      {logos.map((logo) => (
          <div
            key={logo.name}
            className="group flex items-center justify-center bg-background px-6 py-10 transition-colors duration-300 hover:bg-muted/50"
          >
            <img
              src={logo.src}
              alt={logo.name}
              loading="lazy"
              className="h-7 w-auto opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:invert"
            />
          </div>
        ))}
    </LogoFrame>
  );
}
