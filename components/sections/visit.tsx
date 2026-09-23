import {
  ArrowRight,
  Bot,
  CalendarDays,
  Clock,
  GraduationCap,
  MapPin,
  TrainFront,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { EarthZoom, type Place } from "@/components/ui/earth-zoom";
import { PORTAL_LOGIN_URL } from "@/lib/portal";

/** Every button on the page leads to the portal sign-in; build days are booked from there. */
export const SCHEDULE_HREF = PORTAL_LOGIN_URL;

const MIX_CENTER: Place = {
  name: "ASU MIX Center",
  subtitle: "Media and Immersive eXperience Center · Arizona State University",
  address: "50 N Centennial Way, Mesa, AZ 85201",
  lat: 33.4164427,
  lng: -111.8297633,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=ASU+MIX+Center%2C+50+N+Centennial+Way%2C+Mesa%2C+AZ+85201",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=ASU+MIX+Center%2C+50+N+Centennial+Way%2C+Mesa%2C+AZ+85201",
};

const FACTS = [
  { icon: MapPin, text: "Mesa, AZ · ASU @ Mesa City Center" },
  { icon: CalendarDays, text: "Fall 2026" },
  { icon: Clock, text: "2-hour hands-on session" },
  { icon: GraduationCap, text: "Free to all IR4All students" },
  { icon: Bot, text: "Industrial robots and an XR lab" },
  { icon: TrainFront, text: "On the light rail from ASU Tempe" },
];

/** The conversion point: get students to the MIX Center in person. */
export function Visit() {
  return (
    <Section id="visit" className="bg-muted/40">
      <SectionHeading
        eyebrow="Phase 2 · In person"
        title="Come build at the ASU MIX Center"
        description="A state-of-the-art XR and robotics lab in downtown Mesa where you complete Phase 2. Work with industrial robots, step into extended reality, and receive your ASU credential in person."
      />

      <EarthZoom place={MIX_CENTER} className="mx-auto mt-14 max-w-5xl" />

      <div className="mx-auto mt-10 max-w-5xl">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FACTS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={SCHEDULE_HREF}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Schedule your build day
            <ArrowRight className="size-4" />
          </a>
          <a
            href={PORTAL_LOGIN_URL}
            className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Ask a question
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Finish the four online modules first. Build day scheduling unlocks after
          Phase 1.
        </p>
      </div>
    </Section>
  );
}
