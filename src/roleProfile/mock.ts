// Demo/testing fallback only — never written into draft state, so it can
// never overwrite real data and never gets saved as if it were real.
export const MOCK = {
  designation: "Senior Product Manager",
  department: "Product",
  industryType: "B2B SaaS",
  location: "Bangalore",
  workMode: "Hybrid",
  experienceYears: "5-8 years",
  salary: "₹28L - ₹40L · per year",
  headline: "Senior Product Manager · B2B SaaS",
  portrait:
    "A hands-on product leader who has shipped 0-to-1 features, partners closely with engineering and design, and makes data-informed calls under ambiguity.",
  expectedSkills: "Product strategy, Roadmapping, SQL, User research, Cross-functional leadership",
  mustHaves: "5+ years in product management, Experience with B2B SaaS, Shipped 0-to-1 features",
  redFlags: "No end-to-end ownership of the product lifecycle, Pure project-management background",
  targetCompanies: "Freshworks, Zoho, Postman, Chargebee",
  industrySectors: "B2B SaaS, Enterprise software",
  avoidLookalikes: "Similar title but IC-only scope, Program manager without product ownership",
} as const;

export function orMock(value: string, mock: string): string {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "—" ? value : mock;
}
