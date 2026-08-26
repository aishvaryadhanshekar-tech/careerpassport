import type {
  CoverageId,
  Currency,
  Extraction,
  FlagId,
  SalaryPeriod,
} from "./types";

const ROLE_WORDS =
  /\b(engineer|manager|designer|product|lead|director|recruiter|analyst|founder|scientist|consultant)\b/i;

const LOCATIONS = [
  "Bangalore",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Gurgaon",
  "Gurugram",
  "Remote",
  "Singapore",
  "London",
  "New York",
  "India",
] as const;

function sentenceContaining(text: string, pattern: RegExp): string | undefined {
  const parts = text.split(/(?<=[.!?])\s+/);
  const chunks = parts.length ? parts : [text];
  const hit = chunks.find((s) => pattern.test(s));
  if (!hit) return undefined;
  return hit.trim().slice(0, 180);
}

function firstMatch(text: string, re: RegExp): RegExpExecArray | null {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const copy = new RegExp(re.source, flags);
  return copy.exec(text);
}

export function extractFromTranscript(text: string): Extraction {
  const fields: Partial<Record<CoverageId, string>> = {};
  const flags: Partial<Record<FlagId, true>> = {};
  if (!text.trim()) return { fields, flags };

  const designation = extractDesignation(text);
  if (designation) fields.designation = designation;

  const years = extractYears(text);
  if (years) fields.experienceYears = years;

  const location = extractLocation(text);
  if (location) fields.location = location;

  const workMode = extractWorkMode(text);
  if (workMode) fields.workMode = workMode;

  const salaryHit = extractSalary(text);
  if (salaryHit) fields.salary = salaryHit;

  const industry = extractIndustry(text);
  if (industry) fields.industryType = industry;

  const company = extractCompanyType(text);
  if (company) fields.companyType = company;

  const expType = extractExperienceType(text);
  if (expType) fields.experienceType = expType;

  const must = sentenceContaining(
    text,
    /must[- ]have|need someone who|ownership of|on-call/i,
  );
  if (must) fields.mustHaves = must;

  const disq = sentenceContaining(
    text,
    /disqualify|don’t want|don't want|do not want|\bavoid\b|no one who/i,
  );
  if (disq) fields.disqualifier = disq;

  const red = sentenceContaining(
    text,
    /red flag|deal[- ]breaker|worried if/i,
  );
  if (red) fields.redFlags = red;

  const search =
    sentenceContaining(
      text,
      /linkedin|look for them|\bboolean\b|where to find/i,
    ) ??
    sentenceContaining(text, /\bsource\b/i) ??
    sentenceContaining(text, /\bsearch\b/i);
  if (search) fields.searchStrategy = search;

  const salaryCurrency = extractCurrency(text);
  const salaryPeriod = extractPeriod(text);

  const flagTriggers: [FlagId, RegExp][] = [
    ["confidential", /confidential|do not post|don't post|stealth/i],
    ["noUpperSalaryCap", /no upper cap|no cap|uncapped|open salary/i],
    ["newPosition", /new position|new role|net new|headcount add/i],
    ["replacementHiring", /replacement|backfill/i],
    ["firstPrinciplesThinker", /first principle|1st principle|first-principles/i],
    ["aiToolPowerUser", /ai tool|power user|copilot|cursor user/i],
    ["anyExperienceWorks", /any experience|experience flexible|years don't matter/i],
  ];
  for (const [id, re] of flagTriggers) {
    if (re.test(text)) flags[id] = true;
  }

  const result: Extraction = { fields, flags };
  if (salaryCurrency) result.salaryCurrency = salaryCurrency;
  if (salaryPeriod) result.salaryPeriod = salaryPeriod;
  return result;
}

function extractDesignation(text: string): string | undefined {
  const beforeComma = text.split(",")[0]?.trim();
  if (beforeComma && ROLE_WORDS.test(beforeComma) && beforeComma.length < 80) {
    return beforeComma;
  }
  const m = firstMatch(
    text,
    /\b((?:senior|staff|principal|junior|lead)\s+)?[\w+/ -]{0,40}(engineer|manager|designer|recruiter|analyst)\b/i,
  );
  return m?.[0]?.trim();
}

function extractYears(text: string): string | undefined {
  const range = firstMatch(
    text,
    /(\d+\s*[–-]\s*\d+)\s*(years|yrs|yr)\b/i,
  );
  if (range?.[1]) return range[1].replace(/\s+/g, "");
  const to = firstMatch(text, /(\d+)\s*to\s*(\d+)\s*(years|yrs)\b/i);
  if (to) return `${to[1]}–${to[2]}`;
  const single = firstMatch(text, /(\d+)\s*\+?\s*(years|yrs|yr)\b/i);
  if (single?.[1]) return single[1];
  return undefined;
}

function extractLocation(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const loc of LOCATIONS) {
    const idx = lower.indexOf(loc.toLowerCase());
    if (idx !== -1) return text.slice(idx, idx + loc.length);
  }
  return undefined;
}

function extractWorkMode(text: string): string | undefined {
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (/\bwfh\b|work from home/i.test(text)) return "WFH";
  if (/\bremote\b/i.test(text)) return "WFH";
  if (/\bwfo\b|work from office|on[- ]site|\boffice\b/i.test(text)) return "WFO";
  return undefined;
}

function extractSalary(text: string): string | undefined {
  const rupee = firstMatch(
    text,
    /₹\s*[\d.,]+(?:\s*[–-]\s*[\d.,]+)?\s*(l|lpa|lakh|lakhs)?/i,
  );
  if (rupee) return rupee[0].replace(/\s+/g, "");
  const dollar = firstMatch(text, /\$[\d.,]+k?/i);
  if (dollar) return dollar[0];
  const range = firstMatch(
    text,
    /[\d.,]+\s*[–-]\s*[\d.,]+\s*(l|lpa|lakh|lakhs|k)\b/i,
  );
  if (range) return range[0].replace(/\s+/g, " ").trim();
  return undefined;
}

function extractCurrency(text: string): Currency | undefined {
  if (/₹|\binr\b|\blakh|\blpa\b/i.test(text)) return "INR";
  if (/\$|\busd\b/i.test(text)) return "USD";
  if (/€|\beur\b/i.test(text)) return "EUR";
  if (/£|\bgbp\b/i.test(text)) return "GBP";
  if (/\bsgd\b/i.test(text)) return "SGD";
  return undefined;
}

function extractPeriod(text: string): SalaryPeriod | undefined {
  if (/per month|monthly|\/mo\b/i.test(text)) return "Per month";
  if (/per hour|hourly/i.test(text)) return "Per hour";
  if (/per year|\blpa\b|annual/i.test(text)) return "Per year";
  if (/\blakh|\bl\b|₹/i.test(text)) return "Per year";
  return undefined;
}

function extractIndustry(text: string): string | undefined {
  if (/\bfintech\b|\bbanking\b/i.test(text)) return "Fintech";
  if (/\bpayments industry\b|\bin payments\b/i.test(text)) return "Fintech";
  if (/\bsaas\b|\bb2b\b/i.test(text)) return "B2B SaaS";
  if (/\bhr tech\b|\bhrtech\b|\brecruit/i.test(text)) return "HR tech";
  if (/\bhealth/i.test(text)) return "Healthcare";
  if (/\be-?commerce\b/i.test(text)) return "E-commerce";
  if (/\b\bllm\b|machine learning|\bai\b/i.test(text)) return "AI";
  return undefined;
}

function extractCompanyType(text: string): string | undefined {
  if (/\bstartup\b|early[- ]stage/i.test(text)) return "Startup";
  if (/\bmnc\b|\benterprise\b/i.test(text)) return "Enterprise";
  if (/\bagency\b|\bconsultancy\b/i.test(text)) return "Agency";
  if (/product company/i.test(text)) return "Product";
  return undefined;
}

function extractExperienceType(text: string): string | undefined {
  if (/full[- ]time/i.test(text)) return "Full-time";
  if (/\bcontract\b|\bconsultant\b/i.test(text)) return "Contract";
  if (/\bintern/i.test(text)) return "Internship";
  if (/\bfounding\b/i.test(text)) return "Founding";
  return undefined;
}
