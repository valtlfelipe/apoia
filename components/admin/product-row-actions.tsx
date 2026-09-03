"use client";

import { useActionState, useRef } from "react";
import { initialDeleteProductState } from "@/app/admin/(dashboard)/action-state";
import { deleteProductAction } from "@/app/admin/(dashboard)/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { CopyLinkButton } from "@/components/admin/copy-link-button";

export function ProductRowActions({ slug, url }: { slug: string; url: string }) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProductAction.bind(null, slug),
    initialDeleteProductState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <CopyLinkButton url={url} />
        {/* No fields — deleteAction already has `slug` bound in, and ignores
            the FormData argument. This form exists only so requestSubmit()
            below runs the action with useActionState's pending/error
            tracking, instead of calling it as a bare function. */}
        <form ref={formRef} action={deleteAction} />
        <ConfirmDialog
          triggerLabel="Excluir"
          triggerClassName="px-3 py-1.5 text-xs text-red-600 dark:text-red-400"
          title={`Excluir "${slug}"?`}
          description="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          pending={deletePending}
          onConfirm={() => formRef.current?.requestSubmit()}
        />
      </div>
      {deleteState.error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {deleteState.error}
        </p>
      ) : null}
    </div>
  );
}
