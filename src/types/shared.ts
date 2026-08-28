export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PERIODS = ["Per year", "Per month", "Per hour"] as const;
export type SalaryPeriod = (typeof PERIODS)[number];

export type FieldSource = "empty" | "extracted" | "user";

export type FieldState = {
  value: string;
  source: FieldSource;
};
