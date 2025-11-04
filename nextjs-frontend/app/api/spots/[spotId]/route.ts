import { NextRequest, NextResponse } from "next/server";

import { authenticatedFetch } from "@/lib/auth-fetch";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ spotId: string }> },
) {
  const params = await props.params;
  try {
    const data = await authenticatedFetch(`/api/spots/${params.spotId}`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load spot";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ spotId: string }> },
) {
  const params = await props.params;
  const body = await request.json();
  try {
    const data = await authenticatedFetch(`/api/spots/${params.spotId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update spot";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
