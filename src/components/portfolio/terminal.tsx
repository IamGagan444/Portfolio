"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Line = { command: string; output: React.ReactNode };

/**
 * A terminal window that types each command once visible, then reveals its
 * output. Output is server-rendered content passed in as children.
 */
export function Terminal({ title, lines }: { title: string; lines: Line[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [step, setStep] = useState(0); // index of line being typed
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!inView || step >= lines.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setStep(lines.length));
      return () => cancelAnimationFrame(id);
    }
    const command = lines[step]!.command;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setTyped(command.slice(0, i));
      if (i >= command.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          setTyped("");
          setStep((s) => s + 1);
        }, 350);
      }
    }, 45);
    return () => window.clearInterval(id);
  }, [inView, step, lines]);

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border bg-card/70 shadow-[0_0_0_1px_hsl(var(--brand)/0.04),0_30px_80px_-30px_hsl(var(--brand)/0.25)] backdrop-blur">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="space-y-5 p-5 font-mono text-[13px] leading-relaxed sm:p-6">
        {lines.map((line, i) => {
          const done = i < step;
          const typing = i === step;
          // Everything is rendered (SEO, no layout shift); unrevealed parts are just invisible.
          return (
            <div key={line.command} className="space-y-2">
              <p className={done || typing ? undefined : "opacity-0"}>
                <span className="text-brand">➜</span> <span className="text-muted-foreground">~</span>{" "}
                {typing ? typed : line.command}
                {typing && <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.15em] animate-blink bg-brand" />}
              </p>
              <motion.div
                initial={false}
                animate={{ opacity: done ? 1 : 0, y: done ? 0 : 6 }}
                transition={{ duration: 0.4 }}
                className="font-sans text-sm text-muted-foreground"
              >
                {line.output}
              </motion.div>
            </div>
          );
        })}
        {step >= lines.length && (
          <p>
            <span className="text-brand">➜</span> <span className="text-muted-foreground">~</span>{" "}
            <span className="inline-block h-[1em] w-[0.5em] translate-y-[0.15em] animate-blink bg-brand" />
          </p>
        )}
      </div>
    </div>
  );
}
