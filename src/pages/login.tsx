/**
 * /login — task P0-05 (FR-A2). NextAuth signIn("credentials") with error
 * mapping: 401 invalid credentials, 429 lockout. Success → /account (or a
 * safe relative ?next= target set by the /account SSR guard).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { emailSchema } from "@/lib/auth-validation";
import nextI18NextConfig from "../../next-i18next.config.js";

interface LoginValues {
  email: string;
  password: string;
}

/** Only same-site relative paths may be used as a post-login target. */
function safeNextPath(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = React.useState<string | null>(null);

  const schema = React.useMemo(
    () =>
      z.object({
        email: emailSchema(t),
        password: z.string().min(1, t("validation.passwordRequired")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });
    if (res?.error) {
      setFormError(
        res.error === "Lockout"
          ? t("login.lockout")
          : res.error === "InvalidCredentials" || res.error === "CredentialsSignin"
            ? t("login.invalidCredentials")
            : t("errors.generic"),
      );
      return;
    }
    await router.push(safeNextPath(router.query.next));
  });

  return (
    <AuthLayout title={t("login.title")}>
      <CardHeader>
        <CardTitle className="text-xl">{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={t("login.title")}
          className="flex flex-col gap-4"
        >
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <div>
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email ? (
              <FieldMessage id="email-error" error>
                {errors.email.message}
              </FieldMessage>
            ) : null}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">{t("fields.password")}</Label>
              <Link
                href="/forgot-password"
                className="mb-1.5 text-xs font-semibold text-brand-mid hover:underline"
              >
                {t("login.forgotLink")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password ? (
              <FieldMessage id="password-error" error>
                {errors.password.message}
              </FieldMessage>
            ) : null}
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("login.submit")}
          </Button>
          <p className="text-center text-sm text-muted">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-mid hover:underline"
            >
              {t("login.registerLink")}
            </Link>
          </p>
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
