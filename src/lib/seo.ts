/**
 * Spellings people may search for a name, e.g. "Gagan Pallai" →
 * Gagan Pallai, Gagan Palai, Gagan, Pallai, Palai, GaganPallai, gaganpallai…
 * Used for meta keywords and schema.org `alternateName`.
 */
export function nameVariants(fullName: string): string[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  // Common misspelling: doubled letters typed once (Pallai → Palai) and vice versa (Palai → Pallai).
  const spellings = (word: string) => {
    const single = word.replace(/([a-z])\1/gi, "$1");
    const doubledL = word.replace(/(?<!l)l(?!l)/gi, "ll");
    return [...new Set([word, single, doubledL])];
  };

  const first = parts[0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";
  const out = new Set<string>([fullName.trim()]);

  for (const f of spellings(first)) {
    out.add(f);
    if (!last) continue;
    for (const l of spellings(last)) {
      out.add(l);
      out.add(`${f} ${l}`);
      out.add(`${l} ${f}`);
      out.add(`${f}${l}`);
      out.add(`${f}${l}`.toLowerCase());
    }
  }
  return [...out];
}

/** Meta keywords: name variants plus role/skill/location terms. */
export function seoKeywords({
  name,
  roles,
  location,
  skills,
}: {
  name: string;
  roles: string[];
  location: string;
  skills: string[];
}): string[] {
  const variants = nameVariants(name);
  const full = name.trim();
  return [
    ...variants,
    `${full} portfolio`,
    `${full} developer`,
    ...roles.map((r) => `${full} ${r}`),
    ...roles,
    ...(location ? [`${roles[0] ?? "Developer"} in ${location}`, `developer ${location}`] : []),
    ...skills.slice(0, 12),
  ].filter((v, i, all) => v && all.indexOf(v) === i);
}
