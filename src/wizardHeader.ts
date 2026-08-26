import type { StepIndex } from "./Stepper";

export function wizardTitle(_step: StepIndex): string {
  return "Create a job";
}

export function wizardBackTo(step: StepIndex): string {
  if (step === 3) return "/step-2";
  if (step === 2) return "/create-job";
  return "/";
}

export function wizardBackAriaLabel(step: StepIndex): string {
  if (step === 3) return "Back to Application";
  if (step === 2) return "Back to Step 1";
  return "Back to Jobs";
}
