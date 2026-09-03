import type { SupportStatus } from "@/lib/db/schema";

export type CreateChargeInput = {
  correlationId: string;
  amountCents: number;
  /** Shown on the payer's receipt. Never include supporter-provided text here. */
  comment: string;
  expiresInSeconds: number;
};

export type CreateChargeResult = {
  providerChargeId: string;
  brCode: string;
  qrCodeImage: string | null;
  expiresAt: Date | null;
};

export type ParsedWebhookEvent = {
  event: string;
  correlationId: string;
  status: SupportStatus;
  paidAmountCents?: number;
  paidAt?: Date;
  /** The Pix network's end-to-end id for the settled transaction, when available. */
  endToEndId?: string;
};

/**
 * Contract every Pix service provider (PSP) module must implement. UI and
 * domain code talk only to this interface — never to a provider by name —
 * so a new PSP is a new file in `providers/` plus one line in the registry.
 */
export interface PixProvider {
  readonly id: string;

  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;

  getChargeStatus(ref: { correlationId: string }): Promise<SupportStatus>;

  /** Verifies the webhook came from this provider. Check BEFORE parsing. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<boolean>;

  /** Returns null for events this provider doesn't recognize (ack, don't process). */
  parseWebhook(rawBody: string): ParsedWebhookEvent | null;

  /**
   * Returns a JSON-safe copy of the webhook payload with payer PII (name,
   * taxID, email, phone) stripped, for audit storage. Called AFTER
   * verifyWebhook, on every payload, before it's persisted.
   */
  redactWebhookPayload(rawBody: string): unknown;
}
