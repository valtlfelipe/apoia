import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Generates a PKCE code_verifier per RFC 7636 §4.1 (43-128 unreserved chars). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** S256 code_challenge derived from a verifier, per RFC 7636 §4.2. */
export function deriveCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Opaque anti-CSRF value for the OAuth `state` parameter. */
export function generateState(): string {
  return randomBytes(24).toString("base64url");
}
