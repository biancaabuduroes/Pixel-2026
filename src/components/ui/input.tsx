import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

/**
 * Figma: TextField › Field (node 13:77). 56px, 12 radius, 1px border-control;
 * Focus 2px border-strong; Error (aria-invalid) 2px border-danger. The second pixel is an
 * inset shadow so the text doesn't shift.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-control-lg w-full min-w-0 rounded-md border border-border-control bg-bg-surface px-4 body-md text-text-primary outline-none transition-colors placeholder:text-text-secondary",
        "focus-visible:border-border-strong focus-visible:shadow-[inset_0_0_0_1px_var(--border-strong)]",
        "aria-invalid:border-border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--border-danger)]",
        "disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled)",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
