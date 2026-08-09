import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        "flex h-10 w-full rounded-card border border-line bg-card px-3 text-sm text-ink",
        "placeholder:text-muted/70 transition-colors",
        "hover:border-brand-border focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-mid/25",
        "disabled:cursor-not-allowed disabled:bg-divider disabled:opacity-70",
        "aria-invalid:border-danger aria-invalid:focus:ring-danger/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        "flex min-h-24 w-full rounded-card border border-line bg-card p-3 text-sm text-ink",
        "placeholder:text-muted/70 transition-colors",
        "hover:border-brand-border focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-mid/25",
        "disabled:cursor-not-allowed disabled:bg-divider disabled:opacity-70",
        "aria-invalid:border-danger aria-invalid:focus:ring-danger/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
