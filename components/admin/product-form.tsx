"use client";

import { useActionState } from "react";
import {
  initialProductFormState,
  type ProductFormState,
} from "@/app/admin/(dashboard)/action-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProductFormProps = {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  defaultValues?: {
    slug?: string;
    name?: string;
    headline?: string;
    description?: string;
    isActive?: boolean;
  };
  slugEditable?: boolean;
  submitLabel: string;
};

export function ProductForm({
  action,
  defaultValues,
  slugEditable = true,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialProductFormState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <Input
          id="slug"
          name="slug"
          defaultValue={defaultValues?.slug}
          disabled={!slugEditable}
          placeholder="financeiro"
          required
        />
        {!slugEditable ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            O slug não pode ser alterado — apoios antigos referenciam este produto por ele. Para
            trocar, desative este produto e crie um novo.
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            Vira a URL /{"<slug>"} — minúsculo, sem espaços. Não dá para alterar depois.
          </p>
        )}
        {state.fieldErrors?.slug ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.slug[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Financeiro"
          required
        />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="headline" className="text-sm font-medium">
          Headline (opcional)
        </label>
        <Input
          id="headline"
          name="headline"
          defaultValue={defaultValues?.headline}
          placeholder="Apoie {creator} no desenvolvimento do {product}"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Aceita <code>{"{creator}"}</code>, <code>{"{creatorFullName}"}</code> e{" "}
          <code>{"{product}"}</code>. Em branco usa o padrão.
        </p>
        {state.fieldErrors?.headline ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.headline[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição (opcional)
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
          rows={3}
        />
        {state.fieldErrors?.description ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <Checkbox
        id="isActive"
        name="isActive"
        defaultChecked={defaultValues?.isActive ?? true}
        label="Ativo"
        description="Desmarcado tira a página do ar (404), mas mantém o histórico de apoios."
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
