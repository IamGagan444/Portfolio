import {
  AwardIcon,
  BriefcaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  SparklesIcon,
  TrophyIcon,
  UserIcon,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/admin/experience", label: "Experience", icon: BriefcaseIcon },
  { href: "/admin/skills", label: "Skills", icon: SparklesIcon },
  { href: "/admin/education", label: "Education", icon: GraduationCapIcon },
  { href: "/admin/certifications", label: "Certifications", icon: AwardIcon },
  { href: "/admin/hackathons", label: "Hackathons", icon: TrophyIcon },
  { href: "/admin/resume", label: "Resume", icon: FileTextIcon },
  { href: "/admin/profile", label: "Profile", icon: UserIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;
