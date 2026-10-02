import type { Metadata } from "next";

import { HackathonsManager } from "@/components/admin/managers";

export const metadata: Metadata = { title: "Hackathons" };

export default function HackathonsPage() {
  return <HackathonsManager />;
}
