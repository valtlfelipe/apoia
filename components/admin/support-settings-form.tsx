"use client";

import { useActionState } from "react";
import {
  initialSupportSettingsFormState,
  type SupportSettingsFormState,
} from "@/app/admin/(dashboard)/action-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="amountPresets" className="text-sm font-medium">
          Valores sugeridos
        </label>
        <Input
          id="amountPresets"
          name="amountPresets"
          defaultValue={defaultValues.amountPresets.join(",")}
          placeholder="500,1500,2500"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Em centavos, separados por vírgula — os botões de valor rápido no formulário público.
        </p>
        {state.fieldErrors?.amountPresets ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.amountPresets[0]}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="minAmountCents" className="text-sm font-medium">
            Valor mínimo (R$)
          </label>
          <Input
            id="minAmountCents"
            name="minAmountCents"
            inputMode="decimal"
            defaultValue={centsToReaisInput(defaultValues.minAmountCents)}
            placeholder="1,00"
          />
          {state.fieldErrors?.minAmountCents ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.minAmountCents[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="maxAmountCents" className="text-sm font-medium">
            Valor máximo (R$)
          </label>
          <Input
            id="maxAmountCents"
            name="maxAmountCents"
            inputMode="decimal"
            defaultValue={centsToReaisInput(defaultValues.maxAmountCents)}
            placeholder="10000,00"
          />
          {state.fieldErrors?.maxAmountCents ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.maxAmountCents[0]}
            </p>
          ) : null}
        </div>
      </div>

      <Checkbox
        id="defaultPublic"
        name="defaultPublic"
        defaultChecked={defaultValues.defaultPublic}
        label="Aparecer na timeline por padrão"
        description="Se o checkbox 'aparecer na timeline' do formulário público já começa marcado."
      />
      <Checkbox
        id="showTotalCount"
        name="showTotalCount"
        defaultChecked={defaultValues.showTotalCount}
        label="Mostrar número de apoios"
        description="Exibe a contagem total de apoios acima da timeline pública."
      />
      <Checkbox
        id="showTotalAmount"
        name="showTotalAmount"
        defaultChecked={defaultValues.showTotalAmount}
        label="Mostrar total arrecadado"
        description="Exibe a soma de todos os apoios acima da timeline — decisão de quem hospeda."
      />

      <div className="space-y-1.5">
        <label htmlFor="avatarStyle" className="text-sm font-medium">
          Estilo do avatar
        </label>
        <Input
          id="avatarStyle"
          name="avatarStyle"
          defaultValue={defaultValues.avatarStyle}
          placeholder="notionists"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Qualquer estilo de{" "}
          <a
            href="https://www.dicebear.com/styles/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--color-border)] decoration-2 underline-offset-2 hover:text-[var(--color-text)]"
          >
            dicebear.com/styles
          </a>{" "}
          (ex.: notionists, thumbs, bottts).
        </p>
        {state.fieldErrors?.avatarStyle ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.avatarStyle[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="chargeExpiresInSeconds" className="text-sm font-medium">
          Validade da cobrança Pix (segundos)
        </label>
        <Input
          id="chargeExpiresInSeconds"
          name="chargeExpiresInSeconds"
          type="number"
          min={1}
          step={1}
          defaultValue={defaultValues.chargeExpiresInSeconds}
        />
        <p className="text-xs text-[var(--color-text-muted)]">Ex.: 1800 = 30 minutos.</p>
        {state.fieldErrors?.chargeExpiresInSeconds ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.chargeExpiresInSeconds[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="thankYouMessage" className="text-sm font-medium">
          Mensagem de agradecimento
        </label>
        <Textarea
          id="thankYouMessage"
          name="thankYouMessage"
          rows={2}
          maxLength={300}
          defaultValue={defaultValues.thankYouMessage}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Mostrada no modal de sucesso após o pagamento confirmar. Aceita <code>{"{amount}"}</code>{" "}
          como placeholder do valor pago.
        </p>
        {state.fieldErrors?.thankYouMessage ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.thankYouMessage[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
