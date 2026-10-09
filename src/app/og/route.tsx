import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getProfile } from "@/lib/data/portfolio";

/**
 * Branded 1200×630 social share card (Open Graph / Twitter) built around the
 * GP favicon mark. Used for link previews in chats and social apps.
 * Optional `?title=` renders a page-specific headline under the name.
 */
export async function GET(request: Request) {
  const [profile, logo] = await Promise.all([
    getProfile(),
    readFile(join(process.cwd(), "public/android_chrome_512x512.png")),
  ]);
  const name = profile?.name ?? "Portfolio";
  const role = profile?.roles[0] ?? "Developer";
  const title = new URL(request.url).searchParams.get("title")?.slice(0, 80);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "radial-gradient(circle at 20% 30%, #0f2e27 0%, #070a0a 60%)",
          color: "#e6f0ee",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
        <img
          src={logoSrc}
          width={300}
          height={300}
          alt=""
          style={{ borderRadius: 9999, border: "6px solid #38dba8", boxShadow: "0 0 80px rgba(56,219,168,0.35)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{name}</div>
          <div style={{ fontSize: 36, color: "#38dba8" }}>{title ?? role}</div>
          {profile?.location && (
            <div style={{ fontSize: 26, color: "#8fa39e" }}>{`📍 ${profile.location}`}</div>
          )}
          {host && <div style={{ fontSize: 26, color: "#8fa39e", marginTop: 12 }}>{host}</div>}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
