// src/lib/benefit-groups.ts
// Benefit options are scoped to an insurance-type group via benefit_options.applicable_to.
// This is the single source of truth for those groups — used by the Benefits Manager,
// the benefits API, the policy wizard and the calculator.

export const BENEFIT_GROUPS = [
  { value: "private", label: "Motor — Private" },
  { value: "commercial", label: "Motor — Commercial" },
  { value: "both", label: "Motor — Private & Commercial" },
  { value: "medical", label: "Medical / Health" },
  { value: "carriers_liability", label: "Carrier's Liability" },
  { value: "professional_indemnity", label: "Professional Indemnity" },
] as const;

export type BenefitGroup = (typeof BENEFIT_GROUPS)[number]["value"];

export const BENEFIT_GROUP_VALUES = BENEFIT_GROUPS.map(g => g.value) as unknown as [string, ...string[]];

export function benefitGroupLabel(value: string): string {
  return BENEFIT_GROUPS.find(g => g.value === value)?.label || value;
}

/**
 * Does a benefit option apply to the group of the insurance type being quoted?
 * "both" is the legacy motor-wide value — it covers private and commercial only,
 * never medical or the liability covers.
 */
export function benefitAppliesTo(applicableTo: string, group: string): boolean {
  if (group === "none") return false;
  if (applicableTo === group) return true;
  return applicableTo === "both" && (group === "private" || group === "commercial");
}
