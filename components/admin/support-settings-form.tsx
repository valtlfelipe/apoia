"use client";

import { useActionState } from "react";
import {
  initialSupportSettingsFormState,
  type SupportSettingsFormState,
} from "@/app/admin/(dashboard)/action-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type SupportSettingsFormProps = {
  action: (
    prevState: SupportSettingsFormState,
    formData: FormData,
  ) => Promise<SupportSettingsFormState>;
  defaultValues: {
    amountPresets: number[];
    minAmountCents: number;
    maxAmountCents: number;
    defaultPublic: boolean;
    showTotalCount: boolean;
    showTotalAmount: boolean;
    avatarStyle: string;
    chargeExpiresInSeconds: number;
    thankYouMessage: string;
  };
};

// Bare "1.00" for the editable field itself — never formatCents()'s "R$ 1,00"
// (currency symbol included), which lib/format.ts's parseReaisToCents can't
// read back on submit.
function centsToReaisInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function SupportSettingsForm({ action, defaultValues }: SupportSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialSupportSettingsFormState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <Field
        id="amountPresets"
        label="Valores sugeridos"
        error={state.fieldErrors?.amountPresets?.[0]}
        hint="Em centavos, separados por vírgula — os atalhos de valor no formulário público."
      >
        <Input
          id="amountPresets"
          name="amountPresets"
          defaultValue={defaultValues.amountPresets.join(",")}
          placeholder="500,1500,2500"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          id="minAmountCents"
          label="Valor mínimo (R$)"
          error={state.fieldErrors?.minAmountCents?.[0]}
        >
          <Input
            id="minAmountCents"
            name="minAmountCents"
            inputMode="decimal"
            defaultValue={centsToReaisInput(defaultValues.minAmountCents)}
            placeholder="1,00"
          />
        </Field>
        <Field
          id="maxAmountCents"
          label="Valor máximo (R$)"
          error={state.fieldErrors?.maxAmountCents?.[0]}
        >
          <Input
            id="maxAmountCents"
            name="maxAmountCents"
            inputMode="decimal"
            defaultValue={centsToReaisInput(defaultValues.maxAmountCents)}
            placeholder="10000,00"
          />
        </Field>
      </div>

      <div className="space-y-2">
        <Switch
          id="defaultPublic"
          name="defaultPublic"
          defaultChecked={defaultValues.defaultPublic}
          label="Aparecer na timeline por padrão"
          description="Se o botão “aparecer na timeline” do formulário público já começa ligado."
        />
        <Switch
          id="showTotalCount"
          name="showTotalCount"
          defaultChecked={defaultValues.showTotalCount}
          label="Mostrar número de apoios"
          description="Exibe a contagem total no cabeçalho da timeline pública."
        />
        <Switch
          id="showTotalAmount"
          name="showTotalAmount"
          defaultChecked={defaultValues.showTotalAmount}
          label="Mostrar total arrecadado"
          description="Exibe a soma de todos os apoios — decisão de quem hospeda."
        />
      </div>

      <Field
        id="avatarStyle"
        label="Estilo do avatar"
        error={state.fieldErrors?.avatarStyle?.[0]}
        hint={
          <>
            Qualquer estilo de{" "}
            <a
              href="https://www.dicebear.com/styles/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-ink hover:underline"
            >
              dicebear.com/styles
            </a>{" "}
            (ex.: notionists, thumbs, bottts).
          </>
        }
      >
        <Input
          id="avatarStyle"
          name="avatarStyle"
          defaultValue={defaultValues.avatarStyle}
          placeholder="notionists"
        />
      </Field>

      <Field
        id="chargeExpiresInSeconds"
        label="Validade da cobrança Pix (segundos)"
        error={state.fieldErrors?.chargeExpiresInSeconds?.[0]}
        hint="Ex.: 1800 = 30 minutos."
      >
        <Input
          id="chargeExpiresInSeconds"
          name="chargeExpiresInSeconds"
          type="number"
          min={1}
          step={1}
          defaultValue={defaultValues.chargeExpiresInSeconds}
        />
      </Field>

      <Field
        id="thankYouMessage"
        label="Mensagem de agradecimento"
        error={state.fieldErrors?.thankYouMessage?.[0]}
        hint={
          <>
            Mostrada no modal de sucesso após o pagamento confirmar. Aceita{" "}
            <code>{"{amount}"}</code> como placeholder do valor pago.
          </>
        }
      >
        <Textarea
          id="thankYouMessage"
          name="thankYouMessage"
          rows={2}
          maxLength={300}
          defaultValue={defaultValues.thankYouMessage}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
