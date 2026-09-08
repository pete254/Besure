// src/lib/benefit-groups.ts
// Benefit options are scoped to an insurance-type group via benefit_options.applicable_to.
// This is the single source of truth for those groups — used by the Benefits Manager,
// the benefits API, the policy wizard and the calculator.

export const BENEFIT_GROUPS = [
  { value: "private", label: "Motor — Private" },
  { value: "commercial", label: "Motor — Commercial" },
  { value: "both", label: "Motor — All Types" },
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
 * "both" means motor-wide — private, commercial and commercial third party —
 * and never medical or the liability covers. Third party carries motor-wide
 * benefits only (COMESA), not the full commercial list.
 */
const MOTOR_GROUPS = ["private", "commercial", "commercial_tp"];

export function benefitAppliesTo(applicableTo: string, group: string): boolean {
  if (group === "none") return false;
  if (applicableTo === group) return true;
  return applicableTo === "both" && MOTOR_GROUPS.includes(group);
}

/**
 * Types quoted as a lump-sum premium — the premium is typed in, never
 * calculated as rate × sum insured.
 */
export const MANUAL_PREMIUM_TYPES = ["Carriers Liability", "Professional Indemnity"];

/**
 * Types whose benefit amounts are cover limits, not extra premium.
 * Selecting a benefit on these records the limit but must never move the
 * premium — the quoted premium already covers them.
 */
export const LIMIT_ONLY_BENEFIT_TYPES = ["Medical / Health", ...MANUAL_PREMIUM_TYPES];

export function benefitsAffectPremium(insuranceType: string): boolean {
  return !LIMIT_ONLY_BENEFIT_TYPES.includes(insuranceType);
}
