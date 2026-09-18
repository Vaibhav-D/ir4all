"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { EvervaultCard, Icon } from "@/components/ui/evervault-card";
import { useInputMode } from "@/components/demos/use-input-mode";

/**
 * The "what does it cost" card. With a pointer the price ticks from $10 up to
 * $1,000 on a loop and hovering decodes the card and snaps the number to $0.
 * On touch screens it counts to $250 once it is on screen, then decodes to $0
 * by itself.
 */
export function PriceCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const touch = useInputMode() !== "pointer";
  const [hover, setHover] = useState(false);
  const [price, setPrice] = useState(10);
  const [done, setDone] = useState(false); // touch: counted to 250, now showing $0

  useEffect(() => {
    if (hover || done) return;
    if (touch && !inView) return;
    const id = setInterval(() => {
      setPrice((p) => {
        if (touch && p >= 250) {
          setDone(true);
          return p;
        }
        return p >= 1000 ? 10 : p + 10;
      });
    }, 55);
    return () => clearInterval(id);
  }, [hover, done, touch, inView]);

  const revealed = hover || done;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm px-3 sm:px-0">
      <div
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className="relative flex flex-col items-start rounded-2xl border border-border p-4 sm:h-[30rem]"
      >
        <BorderBeam radius={18} duration={5} />
        <Icon className="absolute -left-3 -top-3 h-6 w-6 text-muted-foreground" />
        <Icon className="absolute -bottom-3 -left-3 h-6 w-6 text-muted-foreground" />
        <Icon className="absolute -right-3 -top-3 h-6 w-6 text-muted-foreground" />
        <Icon className="absolute -bottom-3 -right-3 h-6 w-6 text-muted-foreground" />

        <EvervaultCard
          // Sized from the width on phones; the fixed-height card sizes it on larger screens.
          className="h-auto min-w-0 sm:h-full"
          revealed={done}
          text={
            revealed ? (
              <span
                key="zero"
                className="inline-block font-[family-name:var(--font-orbitron)] tabular-nums animate-in zoom-in-50 duration-300"
              >
                $0
              </span>
            ) : (
              <span key="roll" className="inline-block font-[family-name:var(--font-orbitron)] tabular-nums">
                ${price.toLocaleString("en-US")}
              </span>
            )
          }
        />

        <h3 className="mt-4 text-sm text-muted-foreground">
          {touch ? "Decoded: that" : "Hover to decode. That"} is the whole price of the
          simulator, the build day at ASU, and your credential.
        </h3>
        <p className="mt-4 rounded-full border border-border px-3 py-0.5 text-sm text-foreground">
          For Every Tempe Union Student
        </p>
      </div>
    </div>
  );
}
