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

// Woovi signs every webhook with its own private key and publishes the matching
// public key on an unauthenticated endpoint, relative to whichever API base is
// configured — so sandbox and production each get their own without a second
// setting. Fetching it beats pinning it in source: when Woovi rotates the key,
// the integration follows along on its own.
// See developers.woovi.com/docs/webhook/seguranca/webhook-public-keys.
const WOOVI_PUBLIC_KEYS_PATH = "/webhook/public-keys";

// The endpoint answers with `Cache-Control: public, max-age=3600`, and the docs
// are explicit that it must not be hit once per delivery.
const PUBLIC_KEYS_TTL_MS = 60 * 60 * 1000;

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

type WooviPublicKeysResponse = {
  public_keys: { key: string; key_identifier: string; is_current: boolean }[];
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

let publicKeysCache: { keys: string[]; fetchedAt: number } | null = null;
let publicKeysInFlight: Promise<string[]> | null = null;

async function fetchPublicKeys(): Promise<string[]> {
  // Deliberately not `wooviFetch`: this endpoint takes no auth (the key is
  // public by definition) and webhook verification often runs where the App ID
  // isn't at hand.
  const response = await fetch(`${env.WOOVI_API_URL}${WOOVI_PUBLIC_KEYS_PATH}`, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    await throwWooviError(response, "public key lookup");
  }

  const data = (await response.json()) as WooviPublicKeysResponse;

  // Every key in the list, not just the `is_current` one: during a rotation
  // Woovi publishes the outgoing and incoming keys together, and deliveries
  // signed with the previous one are still in flight (or being retried) for as
  // long as both are listed. Accepting only the current key reintroduces
  // exactly the breakage that fetching the key is meant to avoid.
  const keys = (data.public_keys ?? []).map((entry) => entry.key).filter(Boolean);
  if (keys.length === 0) {
    throw new Error("Woovi public key lookup returned an empty key list");
  }

  return keys;
}

async function getPublicKeys(): Promise<string[]> {
  if (publicKeysCache && Date.now() - publicKeysCache.fetchedAt < PUBLIC_KEYS_TTL_MS) {
    return publicKeysCache.keys;
  }

  // Share one request across concurrent deliveries — a burst of webhooks
  // arriving on a cold cache shouldn't turn into a burst of key lookups.
  publicKeysInFlight ??= fetchPublicKeys().finally(() => {
    publicKeysInFlight = null;
  });

  try {
    const keys = await publicKeysInFlight;
    publicKeysCache = { keys, fetchedAt: Date.now() };
    return keys;
  } catch (error) {
    // The endpoint being briefly unreachable says nothing about whether this
    // delivery is genuine, so keep verifying against the keys already held
    // rather than dropping real payments. Only a cold cache leaves us with
    // nothing to check against.
    if (publicKeysCache) {
      console.warn("Woovi public key refresh failed, verifying against cached keys:", error);
      return publicKeysCache.keys;
    }
    throw error;
  }
}

async function verifyWebhook(rawBody: string, headers: Headers): Promise<boolean> {
  if (env.WOOVI_WEBHOOK_TOKEN) {
    const provided = Buffer.from(headers.get("authorization") ?? "", "utf8");
    const expected = Buffer.from(env.WOOVI_WEBHOOK_TOKEN, "utf8");
    // Byte length, not string length: `timingSafeEqual` throws when the two
    // differ, and a token with any non-ASCII character makes the two counts
    // disagree — a throw here would surface as a 500, not a 401.
    const ok = provided.length === expected.length && timingSafeEqual(provided, expected);
    if (!ok) {
      console.warn(
        "Woovi webhook rejected: Authorization header does not match WOOVI_WEBHOOK_TOKEN",
      );
      return false;
    }
  }

  const signature = headers.get(WOOVI_SIGNATURE_HEADER)?.trim();
  if (!signature) {
    console.warn(`Woovi webhook rejected: no ${WOOVI_SIGNATURE_HEADER} header`);
    return false;
  }

  let publicKeys: string[];
  try {
    publicKeys = await getPublicKeys();
  } catch (error) {
    console.error("Woovi webhook rejected: could not load Woovi's public keys:", error);
    return false;
  }

  // Verify the body exactly as it arrived. Parsing the JSON and re-serializing
  // it to rebuild the payload reorders keys and changes spacing, so the bytes
  // change and the signature stops matching — hence `rawBody`, and hence this
  // running before `parseWebhook`.
  const valid = publicKeys.some((publicKey) => {
    try {
      const verifier = createVerify("sha256");
      verifier.update(Buffer.from(rawBody, "utf8"));
      verifier.end();
      return verifier.verify(publicKey, signature, "base64");
    } catch {
      return false;
    }
  });

  if (!valid) {
    console.warn(
      `Woovi webhook rejected: ${WOOVI_SIGNATURE_HEADER} did not verify against any published key`,
    );
  }

  return valid;
}

/**
 * Registering a webhook URL on the Woovi dashboard fires a one-off test
 * delivery — `{"data_criacao":…,"evento":"teste_webhook","event":<the event
 * picked in the form>}` — and Woovi saves the URL only if it answers 200
 * (developers.woovi.com/docs/webhook/webhook-test). That request carries no
 * usable `x-webhook-signature`, so verifying it 401s and registration never
 * completes. Acking it is inert: it names no charge, so there is nothing to
 * process and nothing to gain by replaying it.
 */
function isRegistrationPing(rawBody: string): boolean {
  let payload: { evento?: string; data_criacao?: string; charge?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return false;
  }

  // `data_criacao` also catches the shape in the docs, which omits `evento`.
  // Neither field appears in a real event payload, but require the absence of
  // `charge` too, so a genuine delivery can never take this path.
  const looksLikePing = payload.evento === "teste_webhook" || payload.data_criacao !== undefined;
  return looksLikePing && payload.charge === undefined;
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
    endToEndId: payload.charge.status === "COMPLETED" ? payload.pix?.endToEndId : undefined,
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
  isRegistrationPing,
  verifyWebhook,
  parseWebhook,
  redactWebhookPayload,
};
