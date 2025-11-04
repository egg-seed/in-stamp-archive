"use server";

import { forgotPassword, resetPassword, withApiClient } from "@/src/lib/api/client";
import { redirect } from "next/navigation";
import { passwordResetConfirmSchema } from "@/lib/definitions";
import { getErrorMessage } from "@/lib/utils";
import { handleServerActionError } from "@/lib/errors";

export async function passwordReset(prevState: unknown, formData: FormData) {
  const input = {
    body: {
      email: formData.get("email") as string,
    },
  };

  try {
    const { error } = await forgotPassword(withApiClient(input));
    if (error) {
      return { server_validation_error: getErrorMessage(error) };
    }
    return { message: "Password reset instructions sent to your email." };
  } catch (err) {
    const email = formData.get("email") as string;
    return handleServerActionError(err, { email });
  }
}

export async function passwordResetConfirm(
  prevState: unknown,
  formData: FormData,
) {
  const validatedFields = passwordResetConfirmSchema.safeParse({
    token: formData.get("resetToken") as string,
    password: formData.get("password") as string,
    passwordConfirm: formData.get("passwordConfirm") as string,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { token, password } = validatedFields.data;
  const input = {
    body: {
      token,
      password,
    },
  };
  try {
    const { error } = await resetPassword(withApiClient(input));
    if (error) {
      return { server_validation_error: getErrorMessage(error) };
    }
    redirect(`/login`);
  } catch (err) {
    return handleServerActionError(err, { token });
  }
}
