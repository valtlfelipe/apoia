import { createHash } from "node:crypto";
import { env } from "@/lib/config/env";

/**
 * In-memory sliding-window rate limiter, keyed by a hash of the client IP.
 * The IP itself is never stored — only a SHA-256 digest that lives in RAM
 * and is discarded once its window passes. Good enough for a single-node
 * self-hosted app; if you run multiple instances behind a load balancer,
 * put a shared limiter (e.g. Redis) in front instead.
 */

const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

// Periodically drop empty/stale buckets so this doesn't grow unbounded.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, timestamps] of buckets) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }
}

function hashKey(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex");
}

export function checkRateLimit(
  identifier: string,
  limit: number = env.APOIA_RATE_LIMIT_PER_MINUTE,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  sweep(now);

  const key = hashKey(identifier);
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true, remaining: limit - timestamps.length };
}

/** Best-effort client identifier from standard proxy headers, falling back to a constant. */
export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
