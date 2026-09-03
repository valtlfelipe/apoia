import { eq } from "drizzle-orm";
import { closeDb, db } from "@/lib/db/client";
import { supports } from "@/lib/db/schema";

/**
 * Simulates a Woovi OPENPIX:CHARGE_COMPLETED webhook for a support created
 * locally, so you can test the full confirmation flow without a real Pix
 * payment or a public URL for Woovi to reach. Requires
 * APOIA_DEV_SKIP_WEBHOOK_SIGNATURE=true (refused otherwise — it wouldn't
 * pass real signature verification anyway).
 *
 *   pnpm dev:webhook <supportId> [baseUrl]
 */

const supportId = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:3000";

if (!supportId) {
  const pending = await db
    .select({ id: supports.id, amountCents: supports.amountCents, status: supports.status })
    .from(supports)
    .where(eq(supports.status, "pending"))
    .limit(10);

  process.stderr.write("Usage: pnpm dev:webhook <supportId> [baseUrl]\n\n");
  if (pending.length > 0) {
    process.stderr.write("Pending supports you can confirm:\n");
    for (const row of pending) {
      process.stderr.write(`  ${row.id}  (${(row.amountCents / 100).toFixed(2)} BRL)\n`);
    }
  } else {
    process.stderr.write("No pending supports found. Create one via the support form first.\n");
  }
  closeDb();
  process.exit(1);
}

const [support] = await db
  .select({ correlationId: supports.correlationId, amountCents: supports.amountCents })
  .from(supports)
  .where(eq(supports.id, supportId))
  .limit(1);

if (!support) {
  process.stderr.write(`No support found with id "${supportId}".\n`);
  closeDb();
  process.exit(1);
}

const payload = {
  event: "OPENPIX:CHARGE_COMPLETED",
  charge: {
    correlationID: support.correlationId,
    value: support.amountCents,
    status: "COMPLETED",
    paidAt: new Date().toISOString(),
  },
  pix: {
    endToEndId: `E-simulated-${Date.now()}`,
    value: support.amountCents,
    payer: { name: "Dev Simulated Payer", taxID: { taxID: "00000000000", type: "BR:CPF" } },
  },
};

const response = await fetch(`${baseUrl}/api/webhooks/woovi`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

process.stdout.write(`POST ${baseUrl}/api/webhooks/woovi → ${response.status}\n`);
process.stdout.write(`${await response.text()}\n`);

closeDb();
