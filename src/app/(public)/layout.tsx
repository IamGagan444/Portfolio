import Navbar from "@/components/navbar";
import { ScrollProgress } from "@/components/portfolio/effects";
import { SiteFooter, SiteHeader } from "@/components/portfolio/site-chrome";
import { SmoothCursor } from "@/components/portfolio/smooth-cursor";
import { getActiveResume, getProfile, getSkills } from "@/lib/data/portfolio";
import { seoKeywords } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

function twitterHandle(url: string | undefined) {
  const match = url && /(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})/i.exec(url);
  return match ? `@${match[1]}` : undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const [profile, skills] = await Promise.all([getProfile(), getSkills()]);
  const name = profile?.name ?? "Portfolio";
  const role = profile?.roles[0];
  // "Gagan Pallai — MERN stack developer": the name leads, which is what ranks for name searches.
  const homeTitle = role ? `${name} — ${role}` : name;
  const description = profile?.headline ?? "Personal portfolio";
  // Branded share card (GP mark + name), not the profile photo.
  const image = "/og";
  const x = profile?.socialLinks.find((link) => link.platform === "x");

  return {
    title: {
      default: homeTitle,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    authors: [{ name, url: SITE_URL }],
    creator: name,
    publisher: name,
    keywords: profile
      ? seoKeywords({
          name: profile.name,
          roles: profile.roles,
          location: profile.location,
          skills: skills.map((s) => s.name),
        })
      : undefined,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: homeTitle,
      description,
      url: SITE_URL,
      siteName: name,
      locale: "en_US",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: homeTitle }],
    },
    twitter: {
      title: homeTitle,
      description,
      card: "summary_large_image",
      creator: twitterHandle(x?.url),
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [profile, resume] = await Promise.all([getProfile(), getActiveResume()]);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <ScrollProgress />
      <SmoothCursor />
      <SiteHeader profile={profile} />
      {children}
      <SiteFooter profile={profile} />
      <Navbar socialLinks={profile?.socialLinks ?? []} hasResume={Boolean(resume)} />
    </div>
  );
}
