"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AmountPicker } from "@/components/amount-picker";
import { PaymentDialog, type PendingCharge } from "@/components/payment-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedPresetCents, setSelectedPresetCents] = useState(presets[0] ?? minCents);
  const [customValueReais, setCustomValueReais] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(defaultPublic);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<PendingCharge | null>(null);

  const amountCents = useMemo(() => {
    if (isCustomMode) return parseReaisToCents(customValueReais);
    return selectedPresetCents;
  }, [isCustomMode, customValueReais, selectedPresetCents]);

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
        className="shadow-card space-y-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <AmountPicker
          presets={presets}
          isCustomMode={isCustomMode}
          selectedPresetCents={selectedPresetCents}
          customValueReais={customValueReais}
          minCents={minCents}
          maxCents={maxCents}
          onSelectPreset={(cents) => {
            setIsCustomMode(false);
            setSelectedPresetCents(cents);
          }}
          onCustomChange={(value) => {
            setIsCustomMode(true);
            setCustomValueReais(value);
          }}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            Nome <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
          </label>
          <Input
            id="displayName"
            name="displayName"
            maxLength={60}
            placeholder="Como você quer ser chamado"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-sm font-medium text-[var(--color-text)]">
            Mensagem <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
          </label>
          <Textarea
            id="message"
            name="message"
            rows={2}
            maxLength={280}
            placeholder="Deixe uma palavra de apoio"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>

        <Checkbox
          id="isPublic"
          label="Aparecer na timeline"
          description="Se desmarcado, seu apoio aparece como “Anônimo” publicamente — seu nome e mensagem ficam salvos, mas só quem recebe o apoio consegue vê-los."
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
        />

        {error ? (
          <p role="alert" className="text-sm font-medium text-red-500">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={!isAmountValid || submitting}>
          {submitting
            ? "Gerando cobrança…"
            : `Apoiar com Pix${amountCents ? ` · ${formatCents(amountCents)}` : ""}`}
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
