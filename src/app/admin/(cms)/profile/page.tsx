import type { Metadata } from "next";

import { ProfileEditor } from "@/components/admin/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <ProfileEditor />;
}
