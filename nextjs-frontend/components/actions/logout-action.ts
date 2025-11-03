"use server";

import { cookies } from "next/headers";
import { jwtLogout, withApiClient } from "@/src/lib/api/client";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { message: "No access token found" };
  }

  const { error } = await jwtLogout(withApiClient());

  if (error) {
    return { message: error };
  }

  cookieStore.delete("accessToken");
  redirect(`/login`);
}
