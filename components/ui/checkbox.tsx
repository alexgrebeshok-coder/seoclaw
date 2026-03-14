import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          ref={ref}
          id={inputId}
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-[var(--line-strong)] bg-[var(--surface)]",
            "text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "accent-[#3b82f6]",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-[var(--ink-soft)] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
