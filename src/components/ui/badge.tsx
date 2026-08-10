import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pill badges per mockup: navy (featured/info), green (verified/inspected), amber (pending), red (rejected). */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        navy: "bg-brand-light text-brand",
        green: "bg-success-soft text-success-strong",
        amber: "bg-warning-soft text-warning-strong",
        red: "bg-danger-soft text-danger-strong",
        neutral: "bg-divider text-muted-strong",
        solid: "bg-brand text-white",
      },
    },
    defaultVariants: { variant: "navy" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
