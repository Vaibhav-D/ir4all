"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  text,
  className,
  revealed = false,
}: {
  text?: React.ReactNode;
  className?: string;
  /** Show the hover effect without a pointer (touch screens). */
  revealed?: boolean;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  // Forced reveal: light up the centre and keep the characters churning.
  const cardRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!revealed) return;
    const el = cardRef.current;
    if (el) {
      mouseX.set(el.clientWidth / 2);
      mouseY.set(el.clientHeight / 2);
    }
    const id = setInterval(() => setRandomString(generateRandomString(1500)), 140);
    return () => clearInterval(id);
  }, [revealed, mouseX, mouseY]);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div
      className={cn(
        "p-0.5  bg-transparent aspect-square  flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-transparent flex items-center justify-center h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
          revealed={revealed}
        />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center rounded-full text-4xl font-semibold">
            <div className="absolute h-full w-full rounded-full bg-background/80 blur-sm" />
            <span className="z-20 text-foreground">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function CardPattern({ mouseX, mouseY, randomString, revealed }: any) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl  [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r from-brand/80 to-brand opacity-0  group-hover/card:opacity-100 backdrop-blur-xl transition duration-500",
          revealed && "opacity-100"
        )}
        style={style}
      />
      <motion.div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay  group-hover/card:opacity-100",
          revealed && "opacity-100"
        )}
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
