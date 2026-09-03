import { NextResponse } from "next/server";
import { getProduct } from "@/lib/config/products";
import { getTimelinePage } from "@/lib/supports/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const productSlug = searchParams.get("product") ?? undefined;

  if (productSlug && !getProduct(productSlug)) {
    return NextResponse.json({ error: "Produto desconhecido." }, { status: 400 });
  }

  const page = await getTimelinePage({ cursor, productSlug });
  return NextResponse.json(page);
}
