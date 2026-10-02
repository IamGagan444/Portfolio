"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLinkIcon, LogOutIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

import { confirmDiscard } from "./hooks/use-unsaved-changes";
import { ADMIN_NAV } from "./nav-items";

type SidebarProps = {
  admin: { name: string; email: string };
  logoutAction: () => Promise<void>;
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={(e) => {
              if (!active && !confirmDiscard()) {
                e.preventDefault();
                return;
              }
              onNavigate?.();
            }}
            className={cn(
              "relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              active
                ? "bg-muted font-medium text-foreground before:absolute before:-left-3 before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ admin, logoutAction, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const initials = admin.name.slice(0, 1).toUpperCase() || "A";
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-foreground font-mono text-[11px] font-semibold text-background">
          P
        </span>
        <span className="text-sm font-semibold tracking-tight">Portfolio CMS</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Manage</p>
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="space-y-1 border-t p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ExternalLinkIcon className="size-4" /> View site
        </a>
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{admin.name}</p>
            <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
          </div>
          <ModeToggle />
        </div>
        <form
          action={logoutAction}
          onSubmit={(e) => {
            if (!confirmDiscard()) e.preventDefault();
          }}
        >
          <button
            type="submit"
            className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <LogOutIcon className="size-4" /> Log out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:block">
        <SidebarBody {...props} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:hidden">
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger
            className="rounded-md p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="Open navigation"
          >
            <MenuIcon className="size-5" />
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-background shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="absolute right-3 top-4 rounded-md p-1 hover:bg-muted"
                aria-label="Close navigation"
              >
                <XIcon className="size-4" />
              </DialogPrimitive.Close>
              <SidebarBody {...props} onNavigate={() => setOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <span className="text-sm font-semibold tracking-tight">Portfolio CMS</span>
      </header>
    </>
  );
}
