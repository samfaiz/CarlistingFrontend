/**
 * /register — task P0-05 (FR-A1). POST /auth/register; locale preselected
 * from router.locale; success → "check your inbox" state (no auto-login);
 * 409 (email exists) shown inline under the email field.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, apiPost } from "@/lib/api";
import {
  emailSchema,
  passwordSchema,
  withPasswordConfirmation,
} from "@/lib/auth-validation";
import nextI18NextConfig from "../../next-i18next.config.js";

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Endonyms (proper nouns, identical in every locale) — same as LanguageSwitcher. */
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ar: "العربية",
  es: "Español",
  fr: "Français",
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = React.useState<string | null>(null);
  /** Non-null once registration succeeded → "check your inbox" state. */
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  // Account locale, preselected from the active site locale.
  const [accountLocale, setAccountLocale] = React.useState(
    router.locale ?? router.defaultLocale ?? "en",
  );
  const locales = router.locales ?? ["en", "ar", "es", "fr"];

  const schema = React.useMemo(
    () =>
      withPasswordConfirmation(t, {
        name: z.string().trim().min(1, t("validation.nameRequired")),
        email: emailSchema(t),
        password: passwordSchema(t),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiPost("/auth/register", {
        email: values.email,
        password: values.password,
        name: values.name,
        locale: accountLocale,
      });
      setSubmittedEmail(values.email);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError("email", { type: "server", message: t("register.emailExists") });
      } else {
        setFormError(
          err instanceof ApiError ? err.message : t("errors.generic"),
        );
      }
    }
  });

  if (submittedEmail) {
    return (
      <AuthLayout title={t("register.successTitle")}>
        <CardHeader>
          <CardTitle className="text-xl">{t("register.successTitle")}</CardTitle>
          <CardDescription>
            {t("register.successBody", { email: submittedEmail })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/login">{t("register.successLogin")}</Link>
          </Button>
        </CardContent>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("register.title")}>
      <CardHeader>
        <CardTitle className="text-xl">{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={t("register.title")}
          className="flex flex-col gap-4"
        >
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <div>
            <Label htmlFor="name" required>
              {t("fields.name")}
            </Label>
            <Input
              id="name"
              autoComplete="name"
              invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <FieldMessage id="name-error" error>
                {errors.name.message}
              </FieldMessage>
            ) : null}
          </div>
          <div>
            <Label htmlFor="email" required>
              {t("fields.email")}
            </Label>
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
          <div>
            <Label id="locale-label">{t("fields.locale")}</Label>
            <Select value={accountLocale} onValueChange={setAccountLocale}>
              <SelectTrigger aria-labelledby="locale-label" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {LOCALE_NAMES[locale] ?? locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("register.submit")}
          </Button>
          <p className="text-center text-sm text-muted">
            {t("register.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-mid hover:underline"
            >
              {t("register.loginLink")}
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
