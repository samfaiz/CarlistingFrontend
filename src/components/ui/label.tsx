import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("mb-1.5 block text-sm font-semibold text-ink", className)}
    {...props}
  >
    {children}
    {required ? (
      <span className="text-danger ms-0.5" aria-hidden>
        *
      </span>
    ) : null}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

/** Field helper/error line under an input. */
function FieldMessage({
  error,
  children,
  className,
  id,
}: {
  error?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} className={cn("mt-1.5 text-xs", error ? "text-danger" : "text-muted", className)}>
      {children}
    </p>
  );
}

export { Label, FieldMessage };
