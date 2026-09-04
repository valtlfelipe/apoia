import "server-only";
import { env } from "@/lib/config/env";

/**
 * Static facts about the apoia project itself — the same for every
 * self-hosted install, unlike lib/config/config.ts (this instance's own
 * config) or lib/settings (the creator's, DB-backed config). Shown on
 * /admin/about.
 */
export const PROJECT = {
  author: "Felipe Valtl de Mello",
  repository: "https://github.com/valtlfelipe/apoia",
  sponsors: "https://github.com/sponsors/valtlfelipe",
  license: "AGPL-3.0-only",
} as const;

const GITHUB_REPO = "valtlfelipe/apoia";

/** Cache tag for the GitHub release lookup below — revalidated by recheckUpdatesAction. */
export const UPDATES_CACHE_TAG = "apoia-latest-release";

// Matches "1.2.3" or "v1.2.3", with an optional prerelease/build suffix —
// the shape of the vX.Y.Z tags .github/workflows/release.yml builds
// releases from. Captures the version without the leading "v".
const VERSION_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * The version baked into this image at build time (APOIA_VERSION build arg,
 * from the release git tag — see Dockerfile and lib/config/env.ts). Local
 * dev and images built by hand default to "dev".
 */
export function getInstalledVersion(): string {
  return env.APOIA_VERSION.match(VERSION_PATTERN)?.[1] ?? "dev";
}

export type UpdateCheck = {
  status: "available" | "current" | "development" | "unavailable";
  latestVersion: string | null;
  releaseUrl: string | null;
  checkedAt: string;
};

/**
 * Checks GitHub for the latest release and compares it against the
 * installed version. Cached for an hour through Next's fetch cache (tag
 * UPDATES_CACHE_TAG) — an install doesn't need to hit the GitHub API on
 * every /admin/about render; "Verificar novamente" forces a fresh check via
 * revalidateTag (see recheckUpdatesAction in actions.ts).
 */
export async function checkForUpdates(): Promise<UpdateCheck> {
  const checkedAt = new Date().toISOString();

  let latestTag: string | null = null;
  let releaseUrl: string | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600, tags: [UPDATES_CACHE_TAG] },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        tag_name?: unknown;
        draft?: unknown;
        prerelease?: unknown;
        html_url?: unknown;
      };
      if (data.draft !== true && data.prerelease !== true) {
        latestTag = typeof data.tag_name === "string" ? data.tag_name : null;
        releaseUrl = typeof data.html_url === "string" ? data.html_url : null;
      }
    }
  } catch {
    // No internet access from this instance, GitHub unreachable, etc. — a
    // self-hosted install shouldn't break because of an update check.
  }

  const latestVersion = latestTag?.match(VERSION_PATTERN)?.[1];
  if (!latestVersion) {
    return { status: "unavailable", latestVersion: null, releaseUrl: null, checkedAt };
  }

  const installed = getInstalledVersion();
  if (installed === "dev") {
    return { status: "development", latestVersion, releaseUrl, checkedAt };
  }

  return {
    status: compareVersions(latestVersion, installed) > 0 ? "available" : "current",
    latestVersion,
    releaseUrl,
    checkedAt,
  };
}

/** Compares "major.minor.patch" numerically, ignoring any prerelease suffix. */
function compareVersions(a: string, b: string): number {
  const partsOf = (v: string) => v.split(".").map((n) => Number.parseInt(n, 10));
  const [aParts, bParts] = [partsOf(a), partsOf(b)];
  for (let i = 0; i < 3; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
