import type { Metadata } from "next";

import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireAdminPage } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdminPage();
  return <SettingsPanel admin={{ name: admin.name, email: admin.email }} />;
}
