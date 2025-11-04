import { NextRequest, NextResponse } from "next/server";

import { authenticatedFetch } from "@/lib/auth-fetch";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ spotId: string }> },
) {
  const params = await props.params;
  try {
    const data = await authenticatedFetch(`/api/spots/${params.spotId}/images`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load spot images";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ spotId: string }> },
) {
  const params = await props.params;
  const formData = await request.formData();
  try {
    const data = await authenticatedFetch(`/api/spots/${params.spotId}/images/uploads`, {
      method: "POST",
      body: formData,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload spot image";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
