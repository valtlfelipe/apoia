import { createVerify, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/config/env";
import type { SupportStatus } from "@/lib/db/schema";
import type {
  CreateChargeInput,
  CreateChargeResult,
  ParsedWebhookEvent,
  PixProvider,
} from "@/lib/pix/types";

const WOOVI_SIGNATURE_HEADER = "x-webhook-signature";

// Woovi's production public key, used to verify the RSA signature on webhook
// deliveries (see developers.woovi.com/docs/webhook/seguranca/webhook-signature-validation).
// Overridable via WOOVI_WEBHOOK_PUBLIC_KEY for sandbox use or key rotation.
const WOOVI_DEFAULT_PUBLIC_KEY_BASE64 =
  "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlHZk1BMEdDU3FHU0liM0RRRUJBUVVBQTRHTkFEQ0JpUUtCZ1FDLytOdElranpldnZxRCtJM01NdjNiTFhEdApwdnhCalk0QnNSclNkY2EzcnRBd01jUllZdnhTbmQ3amFnVkxwY3RNaU94UU84aWVVQ0tMU1dIcHNNQWpPL3paCldNS2Jxb0c4TU5waS91M2ZwNnp6MG1jSENPU3FZc1BVVUcxOWJ1VzhiaXM1WloySVpnQk9iV1NwVHZKMGNuajYKSEtCQUE4MkpsbitsR3dTMU13SURBUVFCCi0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=";

type WooviChargeStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";

type WooviChargeResponse = {
  charge: {
    correlationID: string;
    value: number;
    status: WooviChargeStatus;
    brCode: string;
    qrCodeImage?: string;
    expiresDate?: string;
    identifier?: string;
  };
};

type WooviWebhookPayload = {
  event: string;
  charge?: {
    correlationID: string;
    value: number;
    status: WooviChargeStatus;
    paidAt?: string;
  };
  pix?: {
    endToEndId: string;
    value: number;
    payer?: { name?: string; taxID?: { taxID?: string; type?: string } };
  };
};

function mapChargeStatus(status: WooviChargeStatus): SupportStatus {
  switch (status) {
    case "COMPLETED":
      return "paid";
    case "EXPIRED":
      return "expired";
    default:
      return "pending";
  }
}

function getAppId(): string {
  if (!env.WOOVI_APP_ID) {
    throw new Error("WOOVI_APP_ID is not configured");
  }
  return env.WOOVI_APP_ID;
}

async function wooviFetch(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${env.WOOVI_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getAppId(),
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  return response;
}

/**
 * Reads the response body (best-effort) and throws with it included, so the
 * server log shows *why* Woovi rejected the request — e.g. a validation
 * error naming the bad field — instead of just a status code. Never exposed
 * to the client: callers only ever see the generic 502 from the route.
 */
async function throwWooviError(response: Response, action: string): Promise<never> {
  const body = await response.text().catch(() => "<no body>");
  console.error(`Woovi ${action} failed with status ${response.status}:`, body);
  throw new Error(`Woovi ${action} failed with status ${response.status}: ${body}`);
}

// Woovi's charge comment rejects more than literal emoji — its "Emoji não é
// permitido" error also fires on em/en dashes, curly quotes, and bullets
// (confirmed against the sandbox; plain ASCII punctuation, accented Latin
// letters, parentheses, and "..." all pass fine). Since the comment is built
// from the self-hoster's own configured creator/product name
// (lib/supports/create.ts), there's no way to guarantee in advance what it
// contains, so normalize "smart" typography to its ASCII equivalent and
// strip actual emoji rather than let charge creation fail on it.
const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u200D|\uFE0F/gu;
const TYPOGRAPHY_REPLACEMENTS: [pattern: RegExp, replacement: string][] = [
  [/[\u2013\u2014]/g, "-"], // en dash, em dash
  [/[\u2018\u2019]/g, "'"], // curly single quotes
  [/[\u201C\u201D]/g, '"'], // curly double quotes
  [/\u2022/g, "-"], // bullet
];

function sanitizeComment(comment: string): string {
  let result = comment;
  for (const [pattern, replacement] of TYPOGRAPHY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(EMOJI_PATTERN, "").replace(/\s+/g, " ").trim();
}

async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  const response = await wooviFetch("/charge", {
    method: "POST",
    body: JSON.stringify({
      correlationID: input.correlationId,
      value: input.amountCents,
      comment: sanitizeComment(input.comment).slice(0, 140),
      expiresIn: input.expiresInSeconds,
    }),
  });

  if (!response.ok) {
    await throwWooviError(response, "charge creation");
  }

  const data = (await response.json()) as WooviChargeResponse;
  const { charge } = data;

  return {
    providerChargeId: charge.identifier ?? charge.correlationID,
    brCode: charge.brCode,
    qrCodeImage: charge.qrCodeImage ?? null,
    expiresAt: charge.expiresDate ? new Date(charge.expiresDate) : null,
  };
}

async function getChargeStatus(ref: { correlationId: string }): Promise<SupportStatus> {
  const response = await wooviFetch(`/charge/${encodeURIComponent(ref.correlationId)}`, {
    method: "GET",
  });

  if (!response.ok) {
    await throwWooviError(response, "charge lookup");
  }

  const data = (await response.json()) as WooviChargeResponse;
  return mapChargeStatus(data.charge.status);
}

async function verifyWebhook(rawBody: string, headers: Headers): Promise<boolean> {
  const signature = headers.get(WOOVI_SIGNATURE_HEADER);
  if (!signature) return false;

  if (env.WOOVI_WEBHOOK_TOKEN) {
    const provided = headers.get("authorization") ?? "";
    const expected = env.WOOVI_WEBHOOK_TOKEN;
    const ok =
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!ok) return false;
  }

  try {
    const publicKeyBase64 = env.WOOVI_WEBHOOK_PUBLIC_KEY ?? WOOVI_DEFAULT_PUBLIC_KEY_BASE64;
    const publicKeyPem = Buffer.from(publicKeyBase64, "base64").toString("ascii");
    const verifier = createVerify("sha256");
    verifier.update(Buffer.from(rawBody, "utf8"));
    verifier.end();
    return verifier.verify(publicKeyPem, signature, "base64");
  } catch {
    return false;
  }
}

function parseWebhook(rawBody: string): ParsedWebhookEvent | null {
  let payload: WooviWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const relevantEvents = new Set([
    "OPENPIX:CHARGE_COMPLETED",
    "OPENPIX:CHARGE_EXPIRED",
    "OPENPIX:CHARGE_CREATED",
  ]);
  if (!relevantEvents.has(payload.event) || !payload.charge) {
    return null;
  }

  return {
    event: payload.event,
    correlationId: payload.charge.correlationID,
    status: mapChargeStatus(payload.charge.status),
    paidAmountCents: payload.charge.status === "COMPLETED" ? payload.charge.value : undefined,
    paidAt: payload.charge.paidAt ? new Date(payload.charge.paidAt) : undefined,
  };
}

function redactWebhookPayload(rawBody: string): unknown {
  try {
    const payload = JSON.parse(rawBody) as WooviWebhookPayload;
    if (payload.pix?.payer) {
      // Never persist the payer's real name / CPF-CNPJ, even in audit logs.
      payload.pix.payer = undefined;
    }
    return payload;
  } catch {
    return { unparseable: true };
  }
}

export const wooviProvider: PixProvider = {
  id: "woovi",
  createCharge,
  getChargeStatus,
  verifyWebhook,
  parseWebhook,
  redactWebhookPayload,
};
