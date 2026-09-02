export function secureRel(rel: string | undefined) {
  const values = new Set(rel?.trim().split(/\s+/).filter(Boolean));
  values.add("noopener");
  return [...values].join(" ");
}

export const ariaDescribedBy = ["a", undefined].filter(Boolean).join(" ") || undefined;
