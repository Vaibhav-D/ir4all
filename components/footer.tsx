import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { Ir4allMark } from "@/components/ui/navbar-1";

const columns = [
  {
    heading: "Program",
    links: [
      { name: "How it works", href: "#program" },
      { name: "Build day", href: "#visit" },
      { name: "Your credential", href: "#faq" },
      { name: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Community",
    links: [
      { name: "Events", href: "#events" },
      { name: "About us", href: "#about" },
      { name: "Research team", href: "#about" },
      { name: "Partners", href: "#about" },
    ],
  },
];

const contacts = [
  { icon: Mail, label: "ir4all@asu.edu", href: "mailto:ir4all@asu.edu", note: "Students" },
  {
    icon: Mail,
    label: "ir4all-schools@asu.edu",
    href: "mailto:ir4all-schools@asu.edu",
    note: "Teachers & schools",
  },
  { icon: Globe, label: "asu.edu/ir4all", href: "https://asu.edu/ir4all", note: "Program page" },
];

function Wordmark() {
  return (
    <Link href="#" className="flex items-center gap-2.5">
      <Ir4allMark className="h-8 w-8" />
      <span className="font-[family-name:var(--font-orbitron)] text-base font-bold tracking-[0.18em]">
        IR<span className="text-brand">4</span>ALL
      </span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Immersive Robotics for All. A free robotics program for Tempe Union
              high school students, from Arizona State University and the APS
              Foundation.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.heading}>
                <h3 className="text-sm font-semibold">{column.heading}</h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-sm font-semibold">Contact</h3>
              <ul className="mt-4 space-y-3">
                {contacts.map(({ icon: Icon, label, href, note }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="group flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-brand" />
                      <span>
                        <span className="block">{label}</span>
                        <span className="block text-xs text-muted-foreground/70">{note}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} IR4All · Arizona State University.
          </p>
          <p className="text-xs text-muted-foreground">
            Free for every TUHSD student · Supported by the APS Foundation
          </p>
        </div>
      </div>
    </footer>
  );
}
