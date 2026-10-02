import Navbar from "@/components/navbar";
import { ScrollProgress } from "@/components/portfolio/effects";
import { SiteFooter, SiteHeader } from "@/components/portfolio/site-chrome";
import { getActiveResume, getProfile } from "@/lib/data/portfolio";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

function twitterHandle(url: string | undefined) {
  const match = url && /(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})/i.exec(url);
  return match ? `@${match[1]}` : undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = profile?.name ?? "Portfolio";
  const description = profile?.headline ?? "Personal portfolio";
  const image = profile?.profileImage?.url;
  const x = profile?.socialLinks.find((link) => link.platform === "x");

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: name,
      description,
      url: SITE_URL,
      siteName: name,
      locale: "en_US",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      title: name,
      description,
      card: "summary_large_image",
      creator: twitterHandle(x?.url),
      ...(image ? { images: [image] } : {}),
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
      <SiteHeader profile={profile} />
      {children}
      <SiteFooter profile={profile} />
      <Navbar socialLinks={profile?.socialLinks ?? []} hasResume={Boolean(resume)} />
    </div>
  );
}
