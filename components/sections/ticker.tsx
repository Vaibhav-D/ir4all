import {
  BadgeDollarSign,
  Cpu,
  GraduationCap,
  MapPin,
  MonitorSmartphone,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

const ITEMS = [
  { icon: BadgeDollarSign, text: "Free for every Tempe Union student" },
  { icon: GraduationCap, text: "Official ASU microcredential" },
  { icon: MonitorSmartphone, text: "3D robot arm simulator, any device" },
  { icon: Wrench, text: "Build a real servo arm" },
  { icon: MapPin, text: "ASU MIX Center · Mesa" },
  { icon: Sparkles, text: "AI tutor built in" },
  { icon: Zap, text: "No experience required" },
  { icon: Cpu, text: "Funded by the APS Foundation" },
];

/** The program in eight beats, scrolling under the hero. */
export function Ticker() {
  return (
    <div className="border-b border-border bg-background py-3.5">
      <Marquee
        duration={48}
        items={ITEMS.map(({ icon: Icon, text }) => (
          <span
            key={text}
            className="flex items-center gap-2.5 pl-5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            <Icon className="size-3.5 text-brand" />
            {text}
            <span aria-hidden className="ml-5 size-1.5 rotate-45 bg-brand/60" />
          </span>
        ))}
      />
    </div>
  );
}
