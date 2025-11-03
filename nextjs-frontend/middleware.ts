import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser, withApiClient } from "@/src/lib/api/client";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { error } = await currentUser(
    withApiClient({
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }),
  );

  if (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
