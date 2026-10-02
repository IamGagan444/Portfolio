import type { Metadata } from "next";

import { CertificationsManager } from "@/components/admin/managers";

export const metadata: Metadata = { title: "Certifications" };

export default function CertificationsPage() {
  return <CertificationsManager />;
}
