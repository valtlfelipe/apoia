import { env } from "@/lib/config/env";
import { getPixProvider } from "@/lib/pix";

/**
 * Registers the webhook endpoint with the active Pix provider. Run this once
 * after deploying (whenever APOIA_SITE_URL changes) so the provider knows
 * where to POST payment confirmations:
 *
 *   pnpm pix:webhook
 */

const WOOVI_EVENTS = ["OPENPIX:CHARGE_COMPLETED", "OPENPIX:CHARGE_EXPIRED"] as const;

async function registerWooviWebhook() {
  const provider = getPixProvider();
  const url = new URL(`/api/webhooks/${provider.id}`, env.APOIA_SITE_URL).toString();

  process.stdout.write(`Registering Woovi webhooks pointing to ${url}\n\n`);

  for (const event of WOOVI_EVENTS) {
    const response = await fetch(`${env.WOOVI_API_URL}/webhook`, {
      method: "POST",
      headers: {
        Authorization: env.WOOVI_APP_ID ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `apoia — ${event}`,
        event,
        url,
        ...(env.WOOVI_WEBHOOK_TOKEN ? { authorization: env.WOOVI_WEBHOOK_TOKEN } : {}),
        isActive: true,
      }),
    });

    if (response.ok) {
      process.stdout.write(`  ✓ ${event}\n`);
    } else {
      const body = await response.text();
      process.stderr.write(`  ✗ ${event} — ${response.status}: ${body}\n`);
    }
  }
}

if (env.PIX_PROVIDER !== "woovi") {
  process.stderr.write(
    `PIX_PROVIDER is "${env.PIX_PROVIDER}", not "woovi" — this script only knows how to register Woovi webhooks.\n` +
      "Register the webhook manually with your provider, pointing to /api/webhooks/<provider>.\n",
  );
  process.exit(1);
}

if (!env.APOIA_SITE_URL.startsWith("https://")) {
  process.stderr.write(
    `APOIA_SITE_URL ("${env.APOIA_SITE_URL}") must be a public HTTPS URL for Woovi to be able to reach it.\n` +
      "Use a tunnel (e.g. cloudflared, ngrok) for local testing.\n",
  );
  process.exit(1);
}

await registerWooviWebhook();
