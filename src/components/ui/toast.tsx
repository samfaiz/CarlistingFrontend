import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastData {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastInput = Omit<ToastData, "id">;

/** Module-level store so `toast()` can be called from anywhere (no context prop-drilling). */
let pushToast: ((t: ToastInput) => void) | null = null;
let nextId = 1;

export function toast(input: ToastInput) {
  pushToast?.(input);
}

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start gap-3 rounded-card border bg-card p-4 shadow-pop",
  {
    variants: {
      variant: {
        success: "border-success/40",
        warning: "border-warning/40",
        error: "border-danger/40",
        info: "border-brand-border/50",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-strong" aria-hidden />,
  warning: <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-strong" aria-hidden />,
  error: <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />,
  info: <Info className="mt-0.5 size-5 shrink-0 text-brand-mid" aria-hidden />,
};

function ToastItem({
  data,
  onOpenChange,
}: {
  data: ToastData;
  onOpenChange: (open: boolean) => void;
} & VariantProps<typeof toastVariants>) {
  const variant = data.variant ?? "info";
  return (
    <ToastPrimitive.Root
      duration={5000}
      onOpenChange={onOpenChange}
      className={cn(toastVariants({ variant }))}
    >
      {ICONS[variant]}
      <div className="flex-1">
        <ToastPrimitive.Title className="text-sm font-bold text-ink">{data.title}</ToastPrimitive.Title>
        {data.description ? (
          <ToastPrimitive.Description className="mt-0.5 text-sm text-muted">
            {data.description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      <ToastPrimitive.Close
        className="rounded-full p-1 text-muted transition-colors hover:bg-divider hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="size-4" aria-hidden />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  React.useEffect(() => {
    pushToast = (input) => setToasts((prev) => [...prev, { ...input, id: nextId++ }]);
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          data={t}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
        />
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 end-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
