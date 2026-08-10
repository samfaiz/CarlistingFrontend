/**
 * Client-side auth validation (zod) mirroring the backend rules — task P0-05.
 * Backend password rule: min 8 chars with upper + lower + digit.
 *
 * Schemas are built with the active `t()` so messages come from the catalog
 * (CLAUDE.md convention #2: no hardcoded UI strings).
 */
import { z } from "zod";
import type { TFunction } from "i18next";

export function emailSchema(t: TFunction) {
  return z.email(t("auth:validation.email"));
}

export function passwordSchema(t: TFunction) {
  return z
    .string()
    .min(8, t("auth:validation.passwordMin"))
    .regex(/[A-Z]/, t("auth:validation.passwordUpper"))
    .regex(/[a-z]/, t("auth:validation.passwordLower"))
    .regex(/\d/, t("auth:validation.passwordDigit"));
}

export function withPasswordConfirmation<T extends z.ZodRawShape>(
  t: TFunction,
  shape: T & { password: z.ZodType<string> },
) {
  return z.object({ ...shape, confirmPassword: z.string() }).refine(
    (data) => {
      // Generic ZodRawShape defeats inference here; the shape always has both.
      const d = data as { password: string; confirmPassword: string };
      return d.password === d.confirmPassword;
    },
    {
      path: ["confirmPassword"],
      message: t("auth:validation.passwordMismatch"),
    },
  );
}
