import { env } from "@/lib/config/env";
import { wooviProvider } from "@/lib/pix/providers/woovi";
import type { PixProvider } from "@/lib/pix/types";

/**
 * Registry of available Pix providers. To add a new PSP: implement
 * `PixProvider` in `providers/<name>.ts`, add it here, and add
 * `"<name>"` to the `PIX_PROVIDER` enum in `lib/config/env.ts`. No other
 * code needs to change — UI and domain logic only ever see `PixProvider`.
 */
const providers: Record<string, PixProvider> = {
  woovi: wooviProvider,
};

let cached: PixProvider | undefined;

export function getPixProvider(): PixProvider {
  if (cached) return cached;
  const provider = providers[env.PIX_PROVIDER];
  if (!provider) {
    throw new Error(
      `Unknown PIX_PROVIDER "${env.PIX_PROVIDER}". Available: ${Object.keys(providers).join(", ")}`,
    );
  }
  cached = provider;
  return provider;
}

export type { PixProvider } from "@/lib/pix/types";
