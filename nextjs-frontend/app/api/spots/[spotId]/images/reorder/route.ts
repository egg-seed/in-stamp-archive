import { NextRequest, NextResponse } from "next/server";

import { authenticatedFetch } from "@/lib/auth-fetch";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ spotId: string }> },
) {
  const params = await props.params;
  const body = await request.json();
  try {
    const data = await authenticatedFetch(`/api/spots/${params.spotId}/images/reorder`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reorder images";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
