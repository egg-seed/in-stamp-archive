import { NextRequest, NextResponse } from "next/server";

import { authenticatedFetch } from "@/lib/auth-fetch";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ spotId: string; imageId: string }> },
) {
  const params = await props.params;
  const body = await request.json();
  try {
    const data = await authenticatedFetch(
      `/api/spots/${params.spotId}/images/${params.imageId}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update image";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ spotId: string; imageId: string }> },
) {
  const params = await props.params;
  try {
    await authenticatedFetch(`/api/spots/${params.spotId}/images/${params.imageId}`, {
      method: "DELETE",
    });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete image";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
