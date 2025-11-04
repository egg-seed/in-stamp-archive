"use server";

import { cookies } from "next/headers";

import { jwtLogin, withApiClient } from "@/src/lib/api/client";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/definitions";
import { getErrorMessage } from "@/lib/utils";
import { handleServerActionError } from "@/lib/errors";

export async function login(prevState: unknown, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;

  const input = {
    body: {
      username,
      password,
    },
  };

  try {
    const { data, error } = await jwtLogin(withApiClient(input));
    if (error) {
      return { server_validation_error: getErrorMessage(error) };
    }
    (await cookies()).set("accessToken", data.access_token);
  } catch (err) {
    return handleServerActionError(err, { username });
  }
  redirect("/dashboard");
}
