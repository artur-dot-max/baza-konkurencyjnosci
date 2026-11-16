import { cn } from "@/lib/utils";

type AnnouncementWizardProgressProps = {
  steps: readonly string[];
  currentStep: number;
};

export function AnnouncementWizardProgress({ steps, currentStep }: AnnouncementWizardProgressProps) {
  return (
    <ol
      aria-label="Kroki formularza"
      className="mb-8 flex items-start"
    >
      {steps.map((label, index) => (
        <li key={label} className={cn("flex items-start", index < steps.length - 1 ? "flex-1" : "") }>
          <div className="flex min-w-8 flex-col items-center gap-2">
            <span
              aria-current={index === currentStep ? "step" : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                index <= currentStep
                  ? "border-navy-600 bg-navy-600 text-white"
                  : "border-gray-300 bg-white text-gray-500"
              )}
            >
              <span className="sr-only">Krok </span>{index + 1}
            </span>
            <span className={cn(
              "hidden max-w-24 text-center text-xs md:block",
              index <= currentStep ? "font-medium text-navy-900" : "text-gray-500"
            )}>
              {label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                "mt-4 h-1 flex-1",
                index < currentStep ? "bg-navy-600" : "bg-gray-200"
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
