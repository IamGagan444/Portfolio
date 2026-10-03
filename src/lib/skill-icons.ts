import type { CloudIcon } from "@/components/portfolio/icon-cloud";
import type { SkillDTO } from "@/lib/validations/portfolio";

// Skill names whose Simple Icons slug isn't derivable from the name.
const ALIASES: Record<string, string[]> = {
  html: ["html5"],
  css: ["css", "css3"],
  tailwind: ["tailwindcss"],
  tailwindcss: ["tailwindcss"],
  materialui: ["mui"],
  mui: ["mui"],
  shadcnui: ["shadcnui"],
  jwt: ["jsonwebtokens"],
  authjs: ["authjs", "auth0"],
  socketio: ["socketdotio"],
  expressjs: ["express"],
  reactjs: ["react"],
  vuejs: ["vuedotjs"],
  golang: ["go"],
  postgres: ["postgresql"],
  aws: ["amazonwebservices"],
  gcp: ["googlecloud"],
};

/** Maps a skill to icon candidates: CMS icon URL first, then Simple Icons slugs. */
export function skillIcon(skill: SkillDTO): CloudIcon {
  const key = skill.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const dotted = skill.name.toLowerCase().replace(/\./g, "dot").replace(/[^a-z0-9]/g, "");
  const slugs = [...new Set([...(ALIASES[key] ?? []), dotted, key])];
  return { name: skill.name, url: skill.icon || undefined, slugs };
}
