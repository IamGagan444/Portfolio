"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useMediaQuery, whenIdle } from "./use-device";

// cobe/WebGL is only downloaded where the globe is actually shown.
const Globe = dynamic(() => import("./globe").then((m) => m.Globe), { ssr: false });

type HeroGlobeProps = React.ComponentProps<typeof import("./globe").Globe>;

/**
 * Hero globe for tablets/desktops, mounted once the browser is idle so it
 * never delays first paint. Phones get a lightweight CSS glow instead.
 */
export function HeroGlobe(props: HeroGlobeProps) {
  const large = useMediaQuery("(min-width: 768px)");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!large) return;
    return whenIdle(() => setReady(true), 2500);
  }, [large]);

  if (!large || !ready) {
    return (
      <div
        aria-hidden
        className="aspect-square w-full rounded-full bg-[radial-gradient(circle_at_50%_40%,hsl(var(--brand)/0.12),transparent_60%)]"
      />
    );
  }
  return <Globe {...props} />;
}
