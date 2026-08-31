/**
 * ConfirmDialog — the dealer portal's one destructive-action prompt.
 *
 * House rule: a confirmation names what happens. That is why `body` is free
 * text supplied by the caller and `effects` takes a list — "this comes off the
 * site, frees a slot and cancels the boost without a refund" is a decision a
 * dealer can make; "are you sure?" is not.
 *
 * The confirm button is not auto-focused: the safe control keeps focus so a
 * stray Enter cannot destroy anything.
 */
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body?: string;
  /** Bullet list of consequences, each one a full sentence. */
  effects?: string[];
  /** Extra controls (a reason field, a reference field) above the footer. */
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** `danger` for anything that removes or revokes. */
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  effects,
  children,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  busy = false,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {body && <DialogDescription>{body}</DialogDescription>}
        </DialogHeader>

        {effects && effects.length > 0 && (
          <ul className="ms-4 list-disc space-y-1 text-sm text-ink">
            {effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        )}

        {children && <div className="mt-4 flex flex-col gap-3">{children}</div>}

        <DialogFooter>
          <Button
            ref={cancelRef}
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
