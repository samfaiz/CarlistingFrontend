/**
 * /reset-password?token=… — task P0-05. New password + confirmation
 * (client rules mirror the backend: min 8, upper+lower+digit).
 * Success → link to /login. Missing token → invalid-link state.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { useForm } from "react-hook-form";
import { AuthLayout, FormAlert } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { passwordSchema, withPasswordConfirmation } from "@/lib/auth-validation";
import nextI18NextConfig from "../../next-i18next.config.js";

interface ResetValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const token =
    router.isReady && typeof router.query.token === "string"
      ? router.query.token
      : null;

  const schema = React.useMemo(
    () => withPasswordConfirmation(t, { password: passwordSchema(t) }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    setFormError(null);
    try {
      await apiPost("/auth/reset-password", { token, password: values.password });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("errors.generic"));
    }
  });

  if (done) {
    return (
      <AuthLayout title={t("reset.successTitle")}>
        <CardHeader>
          <CardTitle className="text-xl">{t("reset.successTitle")}</CardTitle>
          <CardDescription>{t("reset.successBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">{t("reset.goToLogin")}</Link>
          </Button>
        </CardContent>
      </AuthLayout>
    );
  }

  // Query is parsed client-side; render the invalid state only once resolved.
  if (router.isReady && !token) {
    return (
      <AuthLayout title={t("reset.invalidTitle")}>
        <CardHeader>
          <CardTitle className="text-xl">{t("reset.invalidTitle")}</CardTitle>
          <CardDescription>{t("reset.invalidBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/forgot-password">{t("reset.requestNew")}</Link>
          </Button>
        </CardContent>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("reset.title")}>
      <CardHeader>
        <CardTitle className="text-xl">{t("reset.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={t("reset.title")}
          className="flex flex-col gap-4"
        >
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <div>
            <Label htmlFor="password" required>
              {t("fields.password")}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
              {...register("password")}
            />
            {errors.password ? (
              <FieldMessage id="password-error" error>
                {errors.password.message}
              </FieldMessage>
            ) : (
              <FieldMessage id="password-hint">{t("fields.passwordHint")}</FieldMessage>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword" required>
              {t("fields.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <FieldMessage id="confirm-password-error" error>
                {errors.confirmPassword.message}
              </FieldMessage>
            ) : null}
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("reset.submit")}
          </Button>
        </form>
      </CardContent>
    </AuthLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "auth"],
      nextI18NextConfig,
    )),
  },
});
