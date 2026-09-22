import Image from "next/image";
import { Globe, GraduationCap, Mail, PenLine } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { LogoFrame } from "@/components/ui/logo-cloud-2";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";
import { Reveal } from "@/components/ui/reveal";
import { GitHubGlyph, LinkedInGlyph, TeamCard, type TeamLink } from "@/components/ui/team-card";

type Member = {
  slug: string;
  initials: string;
  tag: string;
  name: string;
  role: string;
  photo?: string;
  photoStyle?: "cutout" | "full";
  links: TeamLink[];
};


const TEAM: Member[] = [
  {
    slug: "bogosian",
    initials: "BB",
    tag: "XR & AI Design",
    name: "Dr. Biayna Bogosian",
    role: "Principal Investigator",
    photo: asset("/team/biayna-bogosian-cutout.png"),
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/biaynabogosian/", icon: <LinkedInGlyph /> },
      { label: "Website", href: "https://www.biaynabogosian.com/", icon: <Globe className="size-4" /> },
      { label: "Email", href: "mailto:bogosian@asu.edu", icon: <Mail className="size-4" /> },
    ],
  },
  {
    slug: "herruzo",
    initials: "AH",
    tag: "STEM Equity",
    name: "Dr. Ana Herruzo",
    role: "Co-Principal Investigator",
    photo: asset("/team/ana-herruzo-portrait.png"),
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/ana-herruzo-0780364b/", icon: <LinkedInGlyph /> },
      { label: "ASU profile", href: "https://search.asu.edu/profile/4004411", icon: <Globe className="size-4" /> },
      {
        label: "Research profile",
        href: "https://asu.elsevierpure.com/en/persons/ana-herruzo",
        icon: <GraduationCap className="size-4" />,
      },
    ],
  },
  {
    slug: "garewal",
    initials: "RG",
    tag: "Robotics & AI",
    name: "Rupali Garewal",
    role: "Robotics & AI Researcher",
    links: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/rupali-garewal-95b05b122/",
        icon: <LinkedInGlyph />,
      },
      { label: "Medium", href: "https://rupaligarewal22.medium.com/", icon: <PenLine className="size-4" /> },
      { label: "Email", href: "mailto:rgarewal@asu.edu", icon: <Mail className="size-4" /> },
    ],
  },
  {
    slug: "doifode",
    initials: "VD",
    tag: "Web & XR",
    name: "Vaibhav Doifode",
    role: "Research Assistant",
    photo: asset("/team/vaibhav-doifode-cutout.png"),
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/vaibhav-doifode/", icon: <LinkedInGlyph /> },
      { label: "Website", href: "https://www.vaibhavdoifode.com/", icon: <Globe className="size-4" /> },
      { label: "GitHub", href: "https://github.com/Vaibhav-D", icon: <GitHubGlyph /> },
    ],
  },
  // TODO: replace Mitrang's "#" links with real ones and add a portrait.
  {
    slug: "gupta",
    initials: "MG",
    tag: "Robotics",
    name: "Mitrang Gupta",
    role: "Research Assistant",
    links: [
      { label: "LinkedIn", href: "#", icon: <LinkedInGlyph /> },
      { label: "Email", href: "#", icon: <Mail className="size-4" /> },
    ],
  },
];

const PARTNERS = [
  {
    name: "Arizona State University",
    src: asset("/partners/asu.png"),
    width: 191,
    height: 80,
    text: "Program host, credential issuer, Media and Immersive eXperience (MIX) Center XR lab.",
  },
  {
    name: "APS Foundation",
    src: asset("/partners/aps.png"),
    width: 235,
    height: 80,
    text: "Primary funder. STEM equity & workforce development.",
  },
  {
    name: "Tempe Union High School District",
    src: asset("/partners/tuhsd.png"),
    width: 300,
    height: 66,
    text: "5 high schools, ~12,000 students, 93% minority.",
  },
];

export function About() {
  return (
    <Section id="about">
      <SectionHeading
        align="left"
        eyebrow="IR4All program"
        title="About us"
        description="IR4All is a free, equity-focused robotics education program connecting Tempe Union high school students with real industrial robotics experience, and a pathway to an ASU microcredential."
      />

      <p className="mt-14 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Research team
      </p>
      {/* Three to a row on desktop, two on tablets; a short last row is centred. */}
      <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-8">
        {TEAM.map((member, i) => (
          <Reveal
            key={member.slug}
            delay={(i % 3) * 0.08}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]"
          >
            <TeamCard {...member} />
          </Reveal>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-4xl text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Advisory board</span> · 6–8 members from
        Arizona industry and education guide the program.
      </p>

      <p className="mt-16 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Funders & partners
      </p>
      <LogoFrame columns={3} className="mt-6">
        {PARTNERS.map((partner, i) => (
          <div
            key={partner.name}
            className={cn(
              "group flex flex-col items-center bg-background px-6 py-8 text-center transition-colors duration-300 hover:bg-muted/50",
              i === 2 && "max-sm:col-span-2" // phones: the odd one out sits centred on its own row
            )}
          >
            <div className="flex h-14 items-center rounded-lg bg-white px-3">
              <Image
                src={partner.src}
                alt={partner.name}
                width={partner.width}
                height={partner.height}
                className="h-9 w-auto opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </div>
            <p className="mt-4 text-sm font-medium">{partner.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{partner.text}</p>
          </div>
        ))}
      </LogoFrame>
    </Section>
  );
}
