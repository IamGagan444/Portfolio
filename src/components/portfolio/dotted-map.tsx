import { createMap } from "svg-dotted-map";

import { cn } from "@/lib/utils";

const W = 150;
const H = 75;

// Computed once per server process; the map itself never changes.
const map = createMap({ width: W, height: H, mapSamples: 5200 });
// All land dots as one path of zero-length segments with round caps: tiny HTML, one DOM node.
const DOTS_PATH = map.points.map((p) => `M${p.x.toFixed(2)} ${p.y.toFixed(2)}h0`).join("");

type Place = { lat: number; lng: number; name: string };

type DottedMapProps = {
  home: Place;
  destinations: Place[];
  className?: string;
  children?: React.ReactNode;
};

/**
 * Dotted world map (Magic UI "Dotted Map") with a pulsing home marker and
 * arcs that draw out to cities worldwide, a dot travelling along each.
 * Rendered entirely on the server; animation is SVG/CSS only.
 */
export function DottedMap({ home, destinations, className, children }: DottedMapProps) {
  const [homePt, ...destPts] = map.addMarkers([home, ...destinations].map(({ lat, lng }) => ({ lat, lng })));
  if (!homePt) return null;

  const arcs = destPts.map((to, i) => {
    const mx = (homePt.x + to.x) / 2;
    const my = (homePt.y + to.y) / 2;
    const lift = Math.hypot(to.x - homePt.x, to.y - homePt.y) * 0.32;
    return {
      d: `M${homePt.x} ${homePt.y} Q${mx} ${my - lift} ${to.x} ${to.y}`,
      to,
      name: destinations[i]!.name,
      delay: `${(i * 0.55).toFixed(2)}s`,
    };
  });

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Map showing ${home.name}`}>
        <path d={DOTS_PATH} className="stroke-foreground/25" strokeWidth={0.42} strokeLinecap="round" fill="none" />

        {arcs.map((arc) => (
          <g key={arc.name}>
            <path
              d={arc.d}
              pathLength={1}
              fill="none"
              className="map-arc stroke-brand"
              strokeWidth={0.22}
              strokeLinecap="round"
              style={{ animationDelay: arc.delay }}
            />
            <circle r={0.5} className="fill-brand">
              <animateMotion dur="4s" begin={arc.delay} repeatCount="indefinite" path={arc.d} keyPoints="0;1;1" keyTimes="0;0.5;1" calcMode="linear" />
            </circle>
            <circle cx={arc.to.x} cy={arc.to.y} r={0.55} className="fill-brand/70" />
          </g>
        ))}

        {/* Home: solid core with expanding ripples. */}
        <circle cx={homePt.x} cy={homePt.y} r={1.1} className="fill-brand/30">
          <animate attributeName="r" values="1.1;4.5" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={homePt.x} cy={homePt.y} r={1.1} className="fill-brand/30">
          <animate attributeName="r" values="1.1;4.5" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={homePt.x} cy={homePt.y} r={1.15} className="fill-brand stroke-background" strokeWidth={0.35} />
      </svg>

      {/* HTML overlay anchored to the home marker (percent of the viewBox). */}
      <div
        className="pointer-events-none absolute"
        style={{ left: `${(homePt.x / W) * 100}%`, top: `${(homePt.y / H) * 100}%` }}
      >
        {children}
      </div>
    </div>
  );
}
