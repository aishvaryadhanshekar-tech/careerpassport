import { Link } from "react-router-dom";

export type StepIndex = 1 | 2 | 3;

export const STEPS: {
  index: StepIndex;
  name: string;
  blurb: string;
}[] = [
  { index: 1, name: "Job details", blurb: "Talk, paste, or attach" },
  { index: 2, name: "Application", blurb: "What to ask" },
  { index: 3, name: "Preview", blurb: "Review & confirm" },
];

export function isStepCurrent(current: StepIndex, index: StepIndex): boolean {
  return current === index;
}

export function isStepReachable(current: StepIndex, index: StepIndex): boolean {
  return index < current;
}

export function stepPath(index: StepIndex): string {
  if (index === 2) return "/step-2";
  if (index === 3) return "/step-3";
  return "/create-job";
}

export function stepperAriaLabel(current: StepIndex): string {
  const step = STEPS.find((item) => item.index === current);
  return `Step ${current} of 3, ${step?.name ?? ""}`;
}

export function Stepper({ current }: { current: StepIndex }) {
  const label = stepperAriaLabel(current);
  return (
    <nav className="stepper" aria-label={label}>
      <ol className="stepper-list">
        {STEPS.map((step) => {
          const currentStep = isStepCurrent(current, step.index);
          const reachable = isStepReachable(current, step.index);
          const body = (
            <>
              <span className="stepper-name">{step.name}</span>
              <span className="stepper-blurb">{step.blurb}</span>
            </>
          );
          return (
            <li
              key={step.index}
              className="stepper-slot"
              aria-current={currentStep ? "step" : undefined}
            >
              {reachable ? (
                <Link
                  to={stepPath(step.index)}
                  className="stepper-step stepper-step-link"
                >
                  {body}
                </Link>
              ) : (
                <div
                  className={currentStep ? "stepper-step current" : "stepper-step"}
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
