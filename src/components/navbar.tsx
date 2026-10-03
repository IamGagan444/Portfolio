import { Dock, DockIcon } from "@/components/magicui/dock";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { SocialIcon } from "@/components/social-icon";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export default function Navbar({ socialLinks, hasResume }: NavbarProps) {
  const social = socialLinks.filter((link) => link.showInNav);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex origin-bottom h-full max-h-14">
      <div className="fixed bottom-0 inset-x-0 h-16 w-full bg-background to-transparent backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_top,black,transparent)] dark:bg-background"></div>
      <Dock className="z-50 pointer-events-auto relative mx-auto flex min-h-full h-full items-center px-1 bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] ">
        {NAV_ITEMS.map((item) => (
          <DockIcon key={item.href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12"
                  )}
                >
                  <item.icon className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        {hasResume && (
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/resume"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Resume"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12"
                  )}
                >
                  <FileTextIcon className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resume</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        )}
        {social.length > 0 && (
          <Separator orientation="vertical" className="h-full" />
        )}
        {social.map((link) => (
          <DockIcon key={link.url}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={link.url}
                  aria-label={link.label}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12"
                  )}
                >
                  <SocialIcon platform={link.platform} className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{link.label}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-full py-2" />
        <DockIcon>
          <Tooltip>
            <TooltipTrigger asChild>
              <AnimatedThemeToggler />
            </TooltipTrigger>
            <TooltipContent>
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
        </DockIcon>
      </Dock>
    </div>
  );
}
