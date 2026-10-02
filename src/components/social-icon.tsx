import { Icons, type IconProps } from "@/components/icons";
import type { SocialPlatform } from "@/lib/validations/portfolio";

const ICONS: Record<SocialPlatform, (props: IconProps) => React.ReactElement> = {
  github: Icons.github,
  linkedin: Icons.linkedin,
  x: Icons.x,
  instagram: Icons.instagram,
  youtube: Icons.youtube,
  email: Icons.email,
  website: Icons.globe,
  other: Icons.globe,
};

export function SocialIcon({ platform, ...props }: IconProps & { platform: string }) {
  const Icon = ICONS[platform as SocialPlatform] ?? Icons.globe;
  return <Icon {...props} />;
}
