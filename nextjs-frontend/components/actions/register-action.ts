"use server";

import { redirect } from "next/navigation";

import { terRegister, withApiClient } from "@/src/lib/api/client";

import { registerSchema } from "@/lib/definitions";
import { getErrorMessage } from "@/lib/utils";
import { handleServerActionError } from "@/lib/errors";

export async function register(prevState: unknown, formData: FormData) {
  const validatedFields = registerSchema.safeParse({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const input = {
    body: {
      email,
      password,
    },
  };
  try {
    const { error } = await terRegister(withApiClient(input));
    if (error) {
      return { server_validation_error: getErrorMessage(error) };
    }
  } catch (err) {
    return handleServerActionError(err, { email });
  }
  redirect(`/login`);
}
