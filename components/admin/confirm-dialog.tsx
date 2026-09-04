"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
};

/**
 * A native <dialog>-based confirmation, in the same shape as the
 * showModal()/close() pattern in components/payment-dialog.tsx — kept
 * generic (no knowledge of forms or server actions) so `onConfirm` can be
 * whatever the caller needs, e.g. `formRef.current?.requestSubmit()`.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={triggerClassName}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-6 text-ink shadow-pop backdrop:bg-transparent"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                dialogRef.current?.close();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
