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

/**
 * A webhook delivery reduced to what the domain acts on. `correlationId` and
 * `providerChargeId` are both optional but **at least one is always set** —
 * whichever the provider echoes back is how the support row gets matched
 * (see `confirmSupport`). `parseWebhook` returns null rather than an event
 * with neither.
 */
export type ParsedWebhookEvent = {
  event: string;
  /** Our own id, when the provider echoes it back on the payload. */
  correlationId?: string;
  /** The provider's own id for the charge, when the payload carries it. */
  providerChargeId?: string;
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

  /**
   * Both ids are passed because providers disagree on which one addresses a
   * charge: Woovi looks it up by our `correlationId`, AbacatePay only by its
   * own id. `providerChargeId` is null until `createCharge` returns.
   */
  getChargeStatus(ref: {
    correlationId: string;
    providerChargeId: string | null;
  }): Promise<SupportStatus>;

  /**
   * True when the body is the provider's URL-registration ping — the unsigned
   * request a PSP fires at the endpoint to confirm it answers before saving the
   * webhook. The route acks these with an empty 200 without verifying them, so
   * only ever return true for a payload that carries nothing to act on.
   * Providers that register webhooks purely over their API never see one, and
   * return false.
   */
  isRegistrationPing(rawBody: string): boolean;

  /**
   * Verifies the webhook came from this provider. Check BEFORE parsing.
   * Takes the whole Request, not just its headers: some providers (AbacatePay)
   * authenticate with a secret in the query string rather than a header.
   */
  verifyWebhook(rawBody: string, request: Request): Promise<boolean>;

  /** Returns null for events this provider doesn't recognize (ack, don't process). */
  parseWebhook(rawBody: string): ParsedWebhookEvent | null;

  /**
   * Returns a JSON-safe copy of the webhook payload with payer PII (name,
   * taxID, email, phone) stripped, for audit storage. Called AFTER
   * verifyWebhook, on every payload, before it's persisted.
   */
  redactWebhookPayload(rawBody: string): unknown;
}
