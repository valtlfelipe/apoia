"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the link is
      // still visible/selectable elsewhere, so this is non-fatal.
    }
  }, [url]);

  return (
    <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleCopy}>
      {copied ? "Link copiado ✓" : "Copiar link"}
    </Button>
  );
}
