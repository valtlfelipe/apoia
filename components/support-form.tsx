"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AmountPicker, amountFieldValue } from "@/components/amount-picker";
import { PaymentDialog, type PendingCharge } from "@/components/payment-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, parseReaisToCents } from "@/lib/format";

type SupportFormProps = {
  presets: number[];
  minCents: number;
  maxCents: number;
  defaultPublic: boolean;
  thankYouMessage: string;
  productSlug?: string;
};

export function SupportForm({
  presets,
  minCents,
  maxCents,
  defaultPublic,
  thankYouMessage,
  productSlug,
}: SupportFormProps) {
  const router = useRouter();

  const [amountReais, setAmountReais] = useState(() => amountFieldValue(presets[0] ?? minCents));
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(defaultPublic);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<PendingCharge | null>(null);

  const amountCents = parseReaisToCents(amountReais);
  const isAmountValid = amountCents !== null && amountCents >= minCents && amountCents <= maxCents;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isAmountValid || amountCents === null) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          displayName: displayName || undefined,
          message: message || undefined,
          isPublic,
          productSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível gerar a cobrança. Tente novamente.");
        return;
      }

      setCharge(data as PendingCharge);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // Stable identities — an inline arrow function here gets recreated every
  // render, which would defeat the point of PaymentDialog depending on these
  // as effect inputs.
  const handleClose = useCallback(() => setCharge(null), []);
  const handleConfirmed = useCallback(() => router.refresh(), [router]);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <AmountPicker
          presets={presets}
          valueReais={amountReais}
          minCents={minCents}
          maxCents={maxCents}
          onChange={setAmountReais}
        />

        <Field id="displayName" label="Nome" optional>
          <Input
            id="displayName"
            name="displayName"
            maxLength={60}
            placeholder="Como você quer ser chamado"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </Field>

        <Field id="message" label="Mensagem" optional>
          <Textarea
            id="message"
            name="message"
            rows={3}
            maxLength={280}
            placeholder="Deixe uma palavra de apoio"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Field>

        <Switch
          id="isPublic"
          label="Aparecer na timeline"
          description="Se desligado, seu apoio aparece como “Anônimo” publicamente — nome e mensagem ficam salvos, mas só quem recebe consegue vê-los."
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
        />

        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-ink">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={!isAmountValid || submitting}>
          {submitting
            ? "Gerando cobrança…"
            : `Apoiar com Pix${amountCents !== null ? ` · ${formatCents(amountCents)}` : ""}`}
        </Button>
      </form>

      <PaymentDialog
        charge={charge}
        onClose={handleClose}
        onConfirmed={handleConfirmed}
        thankYouMessage={thankYouMessage}
      />
    </>
  );
}
