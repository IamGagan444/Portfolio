import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { SocialIcon } from "@/components/social-icon";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/lib/validations/portfolio";
import { FileTextIcon, FolderKanbanIcon, HomeIcon, NotebookIcon } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/projects", icon: FolderKanbanIcon, label: "Projects" },
  { href: "/blog", icon: NotebookIcon, label: "Blog" },
];

interface NavbarProps {
  socialLinks: SocialLink[];
  hasResume: boolean;
}

const iconButton = cn(buttonVariants({ variant: "ghost", size: "icon" }), "peer size-12");

/** CSS-only tooltip (hover + keyboard focus); no JS positioning engine. */
function Tip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-all duration-150 peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

export default function Navbar({ socialLinks, hasResume }: NavbarProps) {
  const social = socialLinks.filter((link) => link.showInNav);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex origin-bottom h-full max-h-14">
      {/* Plain gradient fade (a full-width backdrop blur here re-renders on every scroll frame). */}
      <div className="fixed bottom-0 inset-x-0 h-20 w-full bg-gradient-to-t from-background via-background/70 to-transparent" />
      <Dock className="z-50 pointer-events-auto relative mx-auto flex min-h-full h-full items-center px-1 bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] ">
        {NAV_ITEMS.map((item) => (
          <DockIcon key={item.href} className="relative">
            <Link href={item.href} aria-label={item.label} className={iconButton}>
              <item.icon className="size-4" />
            </Link>
            <Tip label={item.label} />
          </DockIcon>
        ))}
        {hasResume && (
          <DockIcon className="relative">
            <a href="/resume" target="_blank" rel="noopener noreferrer" aria-label="Resume" className={iconButton}>
              <FileTextIcon className="size-4" />
            </a>
            <Tip label="Resume" />
          </DockIcon>
        )}
        {social.length > 0 && <Separator orientation="vertical" className="h-full" />}
        {social.map((link) => (
          <DockIcon key={link.url} className="relative">
            <Link
              href={link.url}
              aria-label={link.label}
              target={link.url.startsWith("http") ? "_blank" : undefined}
              rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className={iconButton}
            >
              <SocialIcon platform={link.platform} className="size-4" />
            </Link>
            <Tip label={link.label} />
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-full py-2" />
        <DockIcon className="relative">
          <AnimatedThemeToggler className="peer" />
          <Tip label="Theme" />
        </DockIcon>
      </Dock>
    </div>
  );
}
