import { passwordResetConfirm } from "@/components/actions/password-reset-action";
import { resetPassword } from "@/src/lib/api/client";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("../src/lib/api/client", () => ({
  resetPassword: jest.fn(),
  withApiClient: (options: unknown) => options,
}));

describe("passwordReset action", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call resetPassword with the correct input", async () => {
    const formData = new FormData();
    formData.set("resetToken", "token");
    formData.set("password", "P12345678#");
    formData.set("passwordConfirm", "P12345678#");
    // Mock a successful password reset confirm
    (resetPassword as jest.Mock).mockResolvedValue({});

    await passwordResetConfirm({}, formData);

    expect(resetPassword).toHaveBeenCalledWith({
      body: { token: "token", password: "P12345678#" },
    });
    expect(redirect).toHaveBeenCalled();
  });

  it("should return an error message if password reset fails", async () => {
    const formData = new FormData();
    formData.set("resetToken", "invalid_token");
    formData.set("password", "P12345678#");
    formData.set("passwordConfirm", "P12345678#");

    // Mock a failed password reset
    (resetPassword as jest.Mock).mockResolvedValue({
      error: { detail: "Invalid token" },
    });

    const result = await passwordResetConfirm(undefined, formData);

    expect(result).toEqual({ server_validation_error: "Invalid token" });
    expect(resetPassword).toHaveBeenCalledWith({
      body: { token: "invalid_token", password: "P12345678#" },
    });
  });

  it("should return an validation error if passwords are invalid and don't match", async () => {
    const formData = new FormData();
    formData.set("resetToken", "token");
    formData.set("password", "12345678#");
    formData.set("passwordConfirm", "45678#");

    const result = await passwordResetConfirm(undefined, formData);

    expect(result).toEqual({
      errors: {
        password: ["Password should contain at least one uppercase letter."],
        passwordConfirm: ["Passwords must match."],
      },
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors and return server error message", async () => {
    // Mock the resetPassword to throw an error
    const mockError = new Error("Network error");
    (resetPassword as jest.Mock).mockRejectedValue(mockError);

    const formData = new FormData();
    formData.append("resetToken", "token");
    formData.append("password", "P12345678#");
    formData.append("passwordConfirm", "P12345678#");

    const result = await passwordResetConfirm(undefined, formData);

    expect(result).toEqual({
      server_error: "予期しないエラーが発生しました。しばらくしてからお試しください。",
    });
  });
});
