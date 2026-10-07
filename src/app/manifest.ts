import type { MetadataRoute } from "next";

import { getProfile } from "@/lib/data/portfolio";

/** Web app manifest (served at /manifest.webmanifest) using the icons in /public. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getProfile();
  const name = profile?.name ?? "Portfolio";
  return {
    name,
    short_name: name.split(" ")[0] ?? name,
    description: profile?.headline,
    start_url: "/",
    display: "standalone",
    background_color: "#070a0a",
    theme_color: "#070a0a",
    icons: [
      { src: "/android_chrome_192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android_chrome_512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
