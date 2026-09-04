"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * The submit button for the bare `<form action={recheckUpdatesAction}>` on
 * /admin/about — a separate component because useFormStatus only reports
 * its enclosing form's pending state from a child, not from the form
 * element itself. No useActionState here: the action returns nothing to
 * show (see recheckUpdatesAction in actions.ts), the page just re-renders
 * with the fresh check once the action's revalidateTag() takes effect.
 */
export function RecheckUpdatesButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" disabled={pending} className="px-4 py-2 text-xs">
      <RefreshIcon spinning={pending} />
      {pending ? "Verificando…" : "Verificar novamente"}
    </Button>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={spinning ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
    </svg>
  );
}
