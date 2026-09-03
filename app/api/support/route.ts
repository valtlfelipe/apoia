import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createSupport } from "@/lib/supports/create";
import { createSupportSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request.headers);
  const { allowed } = checkRateLimit(identifier);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createSupportSchema().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await createSupport(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create support:", error);
    return NextResponse.json(
      { error: "Não foi possível gerar a cobrança Pix. Tente novamente." },
      { status: 502 },
    );
  }
}
