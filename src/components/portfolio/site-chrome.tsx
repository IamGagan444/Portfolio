import Link from "next/link";

import { SocialIcon } from "@/components/social-icon";
import { initials } from "@/lib/format";
import type { ProfileDTO } from "@/lib/validations/portfolio";

import { LocalTime } from "./effects";
import { Container } from "./section";

const ANCHORS = [
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#projects", label: "Projects" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader({ profile }: { profile: ProfileDTO | null }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="pointer-events-auto group flex items-center gap-2.5 font-mono text-sm"
          aria-label="Home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border bg-background/70 text-xs font-semibold backdrop-blur transition-colors group-hover:border-brand/60 group-hover:text-brand">
            {profile ? initials(profile.name) : "~"}
          </span>
          <span className="hidden text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
            {profile?.name.split(" ")[0].toLowerCase() ?? "portfolio"}
            <span className="text-brand">.dev</span>
          </span>
        </Link>
        <nav
          aria-label="Sections"
          className="pointer-events-auto hidden items-center gap-1 rounded-full border bg-background/60 p-1 backdrop-blur-md md:flex"
        >
          {ANCHORS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {a.label}
            </Link>
          ))}
        </nav>
        <div className="pointer-events-auto hidden items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur-md sm:flex">
          <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_hsl(var(--brand))]" />
          <LocalTime timeZone={profile?.timezone || "Asia/Kolkata"} showZone />
        </div>
      </Container>
    </header>
  );
}

export function SiteFooter({ profile }: { profile: ProfileDTO | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t pb-28 pt-10">
      <Container className="flex flex-col gap-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {profile?.name ?? ""} <span className="text-brand">{"//"}</span> rendered in characters
        </p>
        <div className="flex items-center gap-4">
          {profile?.socialLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target={link.url.startsWith("http") ? "_blank" : undefined}
              rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              className="transition-colors hover:text-brand"
            >
              <SocialIcon platform={link.platform} className="size-4" />
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}
