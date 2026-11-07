import * as React from "react";
import { cn } from "cn";

/**
 * Figma: TextField (node 13:77). Optional label above, prefix (+40) or suffix (RON),
 * helper text, or a bold red error message (Error state).
 */
export function TextField({
  label,
  prefix,
  suffix,
  helper,
  error,
  className,
  id,
  ...input
}: Omit<React.ComponentProps<"input">, "prefix"> & {
  label?: string;
  prefix?: string;
  suffix?: string;
  helper?: string;
  error?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const noteId = `${inputId}-note`;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="label-md text-text-primary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex h-control-lg w-full items-center gap-2 overflow-hidden rounded-md border bg-bg-surface px-4 body-md transition-colors",
          error
            ? "border-border-danger shadow-[inset_0_0_0_1px_var(--border-danger)]"
            : "border-border-control focus-within:border-border-strong focus-within:shadow-[inset_0_0_0_1px_var(--border-strong)]",
        )}
      >
        {prefix && <span className="shrink-0 text-text-primary">{prefix}</span>}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helper ? noteId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-secondary"
          {...input}
        />
        {suffix && <span className="shrink-0 text-text-secondary">{suffix}</span>}
      </div>
      {error ? (
        <p id={noteId} role="alert" className="title-sm text-text-danger">
          {error}
        </p>
      ) : (
        helper && (
          <p id={noteId} className="body-sm text-text-secondary">
            {helper}
          </p>
        )
      )}
    </div>
  );
}
