import { NextRequest, NextResponse } from "next/server";

import { authenticatedFetch } from "@/lib/auth-fetch";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = new URLSearchParams(searchParams);
  const page = query.get("page") ?? "1";
  const size = query.get("size") ?? "12";
  query.set("page", page);
  query.set("size", size);

  const spotType = query.get("spotType");
  if (spotType) {
    query.delete("spotType");
    query.set("category", spotType);
  }

  try {
    const data = await authenticatedFetch(`/api/spots/?${query.toString()}`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load spots";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const data = await authenticatedFetch(`/api/spots/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create spot";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
