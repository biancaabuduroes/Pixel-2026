import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Figma: Components › Button (node 10:110). Pill action.
 * Variants: Primary (black, once per screen), Secondary (outlined), Tertiary (soft grey),
 * Brand (invite/share), Inverse (on dark), Link (underlined text). Disabled = the `disabled` prop.
 * Sizes: lg 56 / md 44 / sm 32.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill whitespace-nowrap outline-none select-none transition-colors focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed [&_img]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-bg-action text-text-inverse",
        secondary: "border-2 border-border-strong bg-bg-surface text-text-primary",
        tertiary: "bg-bg-muted text-text-primary",
        brand: "bg-bg-brand text-text-on-brand",
        inverse: "bg-bg-surface text-text-primary",
        link: "rounded-xs text-text-primary underline underline-offset-4",
      },
      size: {
        lg: "h-control-lg px-6 label-lg",
        md: "h-control-md px-5 label-md",
        sm: "h-control-sm px-4 label-sm",
      },
    },
    compoundVariants: [
      // Link has no container: text style only.
      { variant: "link", size: "lg", className: "h-auto px-0 label-lg" },
      { variant: "link", size: "md", className: "h-auto px-0 label-md" },
      { variant: "link", size: "sm", className: "h-auto px-0 label-sm" },
    ],
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

/** Figma Button › Disabled: grey fill, grey label (any variant except Link). */
const disabledClasses = "disabled:border-transparent disabled:bg-bg-disabled disabled:text-action-disabled-fg";

function Button({
  className,
  variant = "primary",
  size = "lg",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), variant !== "link" && disabledClasses, className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
