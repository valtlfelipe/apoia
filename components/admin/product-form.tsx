"use client";

import { useActionState } from "react";
import {
  initialProductFormState,
  type ProductFormState,
} from "@/app/admin/(dashboard)/action-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <Field
        id="slug"
        label="Slug"
        error={state.fieldErrors?.slug?.[0]}
        hint={
          slugEditable
            ? "Vira a URL /<slug> — minúsculo, sem espaços. Não dá para alterar depois."
            : "O slug não pode ser alterado — apoios antigos referenciam este produto por ele. Para trocar, desative este produto e crie um novo."
        }
      >
        <Input
          id="slug"
          name="slug"
          defaultValue={defaultValues?.slug}
          disabled={!slugEditable}
          placeholder="financeiro"
          required
        />
      </Field>

      <Field id="name" label="Nome" error={state.fieldErrors?.name?.[0]}>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Financeiro"
          required
        />
      </Field>

      <Field
        id="headline"
        label="Headline"
        optional
        error={state.fieldErrors?.headline?.[0]}
        hint={
          <>
            Aceita <code>{"{creator}"}</code>, <code>{"{creatorFullName}"}</code> e{" "}
            <code>{"{product}"}</code>. Em branco usa o padrão.
          </>
        }
      >
        <Input
          id="headline"
          name="headline"
          defaultValue={defaultValues?.headline}
          placeholder="Apoie {creator} no desenvolvimento do {product}"
        />
      </Field>

      <Field
        id="description"
        label="Descrição"
        optional
        error={state.fieldErrors?.description?.[0]}
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
          rows={3}
        />
      </Field>

      <Switch
        id="isActive"
        name="isActive"
        defaultChecked={defaultValues?.isActive ?? true}
        label="Ativo"
        description="Desligado tira a página do ar (404), mas mantém o histórico de apoios."
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
