"use client";

import { useActionState, useRef, useState } from "react";
import {
  type CreatorSettingsFormState,
  initialCreatorSettingsFormState,
} from "@/app/admin/(dashboard)/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CreatorLink = { label: string; url: string };

// Each row needs a stable identity across add/remove for React to keep
// uncontrolled <Input defaultValue> fields matched to the right DOM node —
// the array index alone isn't stable once a row in the middle is removed.
type LinkRow = CreatorLink & { key: string };

type CreatorSettingsFormProps = {
  action: (
    prevState: CreatorSettingsFormState,
    formData: FormData,
  ) => Promise<CreatorSettingsFormState>;
  defaultValues: {
    name?: string;
    shortName?: string;
    tagline?: string;
    avatarUrl?: string;
    links: CreatorLink[];
  };
};

export function CreatorSettingsForm({ action, defaultValues }: CreatorSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialCreatorSettingsFormState);
  const [links, setLinks] = useState<LinkRow[]>(() =>
    defaultValues.links.map((link, i) => ({ ...link, key: `initial-${i}` })),
  );
  const nextKey = useRef(defaultValues.links.length);

  function addLink() {
    setLinks((prev) => [...prev, { key: `new-${nextKey.current++}`, label: "", url: "" }]);
  }

  function removeLink(key: string) {
    setLinks((prev) => prev.filter((link) => link.key !== key));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <Input id="name" name="name" defaultValue={defaultValues.name} placeholder="Apoia" />
        <p className="text-xs text-[var(--color-text-muted)]">Em branco usa o padrão "Apoia".</p>
        {state.fieldErrors?.name ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="shortName" className="text-sm font-medium">
          Nome curto (opcional)
        </label>
        <Input
          id="shortName"
          name="shortName"
          defaultValue={defaultValues.shortName}
          placeholder="Ex.: só o primeiro nome"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Usado onde o nome completo não cabe ("Apoie {"{curto}"} no desenvolvimento do X"). Em
          branco usa a primeira palavra do nome.
        </p>
        {state.fieldErrors?.shortName ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.shortName[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tagline" className="text-sm font-medium">
          Frase curta (opcional)
        </label>
        <Input
          id="tagline"
          name="tagline"
          defaultValue={defaultValues.tagline}
          placeholder="Construindo em público, em open source"
        />
        {state.fieldErrors?.tagline ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.tagline[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="avatarUrl" className="text-sm font-medium">
          URL do avatar (opcional)
        </label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={defaultValues.avatarUrl}
          placeholder="https://…"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Precisa ser https. Em branco usa um avatar gerado automaticamente.
        </p>
        {state.fieldErrors?.avatarUrl ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.avatarUrl[0]}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Links (opcional)</legend>
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.key} className="flex gap-2">
              {/* Fixed-width wrapper, not a className on <Input>: Input
                  already bakes in w-full, which has the same specificity as
                  a width utility passed via className — whichever comes
                  later in Tailwind's generated stylesheet wins, not
                  whichever is written last in JSX, so trying to override it
                  that way is unreliable. Constraining the wrapper's box
                  instead sidesteps that entirely. */}
              <div className="w-28 shrink-0">
                <Input name="linkLabel" defaultValue={link.label} placeholder="GitHub" />
              </div>
              <Input
                name="linkUrl"
                type="url"
                defaultValue={link.url}
                placeholder="https://…"
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                aria-label="Remover link"
                title="Remover link"
                onClick={() => removeLink(link.key)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-600/10 dark:text-red-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={addLink}>
          Adicionar link
        </Button>
        {state.fieldErrors?.links ? (
          <ul className="space-y-0.5">
            {state.fieldErrors.links.map((message) => (
              <li key={message} className="text-xs text-red-600 dark:text-red-400">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
