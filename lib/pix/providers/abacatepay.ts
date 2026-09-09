import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/config/env";
import type { SupportStatus } from "@/lib/db/schema";
import type {
  CreateChargeInput,
  CreateChargeResult,
  ParsedWebhookEvent,
  PixProvider,
} from "@/lib/pix/types";

const ABACATEPAY_SIGNATURE_HEADER = "x-webhook-signature";

// AbacatePay signs webhook bodies with HMAC-SHA256 using this key — which they
// publish verbatim in their own docs (docs.abacatepay.com/pages/webhooks/security),
// the same fixed value for every merchant. That makes the signature an
// integrity check, NOT proof of origin: anyone who reads the docs can forge
// one. Authenticity comes from the `webhookSecret` query param, which is
// per-merchant and secret — hence it's required, not optional (see env.ts).
// Overridable via ABACATEPAY_WEBHOOK_PUBLIC_KEY should they ever rotate it.
const ABACATEPAY_DEFAULT_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

// AbacatePay's `description` column. Longer values are rejected outright.
const MAX_DESCRIPTION_LENGTH = 500;

type AbacatePayChargeStatus =
  | "PENDING"
  | "PAID"
  | "APPROVED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | "UNDER_DISPUTE"
  | "REDEEMED";

/** Every endpoint answers with this envelope, even on a 200 that failed. */
type AbacatePayEnvelope<T> = {
  data: T | null;
  success: boolean;
  error: string | null;
};

type AbacatePayCharge = {
  id: string;
  amount: number;
  status: AbacatePayChargeStatus;
  brCode: string;
  brCodeBase64?: string;
  expiresAt?: string;
};

type AbacatePayCheck = {
  id: string;
  status: AbacatePayChargeStatus;
  expiresAt?: string;
};

type AbacatePayWebhookPayload = {
  event: string;
  data?: {
    transparent?: {
      id: string;
      externalId?: string | null;
      paidAmount?: number;
      status: AbacatePayChargeStatus;
      updatedAt?: string;
    };
    customer?: unknown;
    payerInformation?: unknown;
  };
};

/**
 * Anything not explicitly paid or dead maps to `pending`, which
 * `confirmSupport` treats as a no-op. That's deliberate: a status we don't
 * recognize (or a post-payment one like REFUNDED) must never flip a row.
 */
function mapChargeStatus(status: AbacatePayChargeStatus): SupportStatus {
  switch (status) {
    case "PAID":
    case "APPROVED":
      return "paid";
    case "EXPIRED":
    case "CANCELLED":
    case "FAILED":
      return "expired";
    default:
      return "pending";
  }
}

function getApiKey(): string {
  if (!env.ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY is not configured");
  }
  return env.ABACATEPAY_API_KEY;
}

/**
 * Calls the API and unwraps the envelope. AbacatePay's docs are explicit that
 * a 200 doesn't mean success — `success: false` with a populated `error` comes
 * back on the same status code — so both are checked here rather than at each
 * call site. The response body is logged on failure so the server log shows
 * *why* the call was rejected; it never reaches the client, which only ever
 * sees the generic 502 from the route.
 */
async function abacatePayFetch<T>(path: string, init: RequestInit, action: string): Promise<T> {
  const response = await fetch(`${env.ABACATEPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    console.error(`AbacatePay ${action} failed with status ${response.status}:`, body);
    throw new Error(`AbacatePay ${action} failed with status ${response.status}: ${body}`);
  }

  const envelope = (await response.json()) as AbacatePayEnvelope<T>;
  if (!envelope.success || !envelope.data) {
    console.error(`AbacatePay ${action} returned an error:`, envelope.error);
    throw new Error(`AbacatePay ${action} returned an error: ${envelope.error ?? "unknown"}`);
  }

  return envelope.data;
}

async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  const charge = await abacatePayFetch<AbacatePayCharge>(
    "/transparents/create",
    {
      method: "POST",
      body: JSON.stringify({
        method: "PIX",
        data: {
          amount: input.amountCents,
          description: input.comment.slice(0, MAX_DESCRIPTION_LENGTH),
          expiresIn: input.expiresInSeconds,
          // Carries our correlationId through to the webhook payload, where it
          // comes back as `data.transparent.externalId`.
          externalId: input.correlationId,
        },
      }),
    },
    "charge creation",
  );

  return {
    providerChargeId: charge.id,
    brCode: charge.brCode,
    // `brCodeBase64` is deliberately dropped — see lib/supports/create.ts.
    qrCodeImage: null,
    expiresAt: charge.expiresAt ? new Date(charge.expiresAt) : null,
  };
}

async function getChargeStatus(ref: { providerChargeId: string | null }): Promise<SupportStatus> {
  // Unlike Woovi, AbacatePay has no way to look a charge up by our own id —
  // only by theirs. A row without one never got a charge created, so there's
  // nothing to poll for.
  if (!ref.providerChargeId) return "pending";

  const check = await abacatePayFetch<AbacatePayCheck>(
    `/transparents/check?id=${encodeURIComponent(ref.providerChargeId)}`,
    { method: "GET" },
    "charge lookup",
  );

  return mapChargeStatus(check.status);
}

function safeEquals(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyWebhook(rawBody: string, request: Request): Promise<boolean> {
  // The query secret first: it's the only per-merchant credential in the
  // request, so it's what actually authenticates the caller (see the note on
  // ABACATEPAY_DEFAULT_PUBLIC_KEY above).
  if (!env.ABACATEPAY_WEBHOOK_SECRET) return false;

  const providedSecret = new URL(request.url).searchParams.get("webhookSecret");
  if (!providedSecret || !safeEquals(providedSecret, env.ABACATEPAY_WEBHOOK_SECRET)) {
    return false;
  }

  // Then the signature, which proves the body wasn't altered in transit.
  const signature = request.headers.get(ABACATEPAY_SIGNATURE_HEADER);
  if (!signature) return false;

  try {
    const key = env.ABACATEPAY_WEBHOOK_PUBLIC_KEY ?? ABACATEPAY_DEFAULT_PUBLIC_KEY;
    const expected = createHmac("sha256", key)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");
    return safeEquals(signature, expected);
  } catch {
    return false;
  }
}

/**
 * Always false. AbacatePay registers a webhook purely as an API call
 * (`POST /webhooks/create`) or a dashboard form, and never fires a test
 * delivery the endpoint has to answer before the URL is saved — unlike Woovi,
 * where that ping is the whole reason this method exists. Every request that
 * reaches the route is a real event, so every one of them gets verified.
 */
function isRegistrationPing(): boolean {
  return false;
}

function parseWebhook(rawBody: string): ParsedWebhookEvent | null {
  let payload: AbacatePayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return null;
  }

  // `transparent.completed` is the only event we act on. AbacatePay has no
  // expiry event — an unpaid charge going stale is caught by the countdown in
  // the payment dialog and by the status-polling fallback.
  const charge = payload.data?.transparent;
  if (payload.event !== "transparent.completed" || !charge) {
    return null;
  }

  const status = mapChargeStatus(charge.status);

  return {
    event: payload.event,
    // `externalId` is what we sent as `correlationId` at creation. It should
    // always come back, but `id` is always there to fall back on.
    correlationId: charge.externalId ?? undefined,
    providerChargeId: charge.id,
    status,
    paidAmountCents: status === "paid" ? charge.paidAmount : undefined,
    paidAt: charge.updatedAt ? new Date(charge.updatedAt) : undefined,
    // No endToEndId: AbacatePay exposes `endToEndIdentifier` only on payouts
    // and outbound transfers, never on a received charge. The admin table
    // falls back to the provider charge id instead.
  };
}

function redactWebhookPayload(rawBody: string): unknown {
  try {
    const payload = JSON.parse(rawBody) as AbacatePayWebhookPayload;
    if (payload.data) {
      // `customer` holds name/email/taxID and `payerInformation` the payer's
      // name/taxID (or card brand and last 4). Neither belongs in an audit row.
      payload.data.customer = undefined;
      payload.data.payerInformation = undefined;
    }
    return payload;
  } catch {
    return { unparseable: true };
  }
}

export const abacatePayProvider: PixProvider = {
  id: "abacatepay",
  createCharge,
  getChargeStatus,
  isRegistrationPing,
  verifyWebhook,
  parseWebhook,
  redactWebhookPayload,
};
