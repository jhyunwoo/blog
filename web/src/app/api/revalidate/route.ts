import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { slug?: string };

  revalidateTag("posts", "max");
  if (body.slug) {
    revalidateTag(`post:${body.slug}`, "max");
  }

  return NextResponse.json({ ok: true });
}
