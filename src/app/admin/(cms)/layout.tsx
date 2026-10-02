import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminPage } from "@/lib/auth/guard";

import { logoutAction } from "./actions";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  // Server-side authorization for every CMS page (the proxy check is only optimistic).
  const admin = await requireAdminPage();

  return (
    <div className="min-h-dvh bg-muted/30">
      <AdminSidebar admin={{ name: admin.name, email: admin.email }} logoutAction={logoutAction} />
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
