/**
 * /forgot-password — task P0-05. POST /auth/forgot-password always answers
 * {sent:true} (no account enumeration), so the page always lands on the
 * success state after submitting.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { emailSchema } from "@/lib/auth-validation";
import nextI18NextConfig from "../../next-i18next.config.js";

interface ForgotValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);

  const schema = React.useMemo(() => z.object({ email: emailSchema(t) }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiPost("/auth/forgot-password", { email: values.email });
    } catch {
      // Deliberate: the contract always answers {sent:true}; never reveal
      // whether an account exists, even if the request itself hiccupped.
    }
    setSubmittedEmail(values.email);
  });

  if (submittedEmail) {
    return (
      <AuthLayout title={t("forgot.successTitle")}>
        <CardHeader>
          <CardTitle className="text-xl">{t("forgot.successTitle")}</CardTitle>
          <CardDescription>
            {t("forgot.successBody", { email: submittedEmail })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/login">{t("forgot.backToLogin")}</Link>
          </Button>
        </CardContent>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("forgot.title")}>
      <CardHeader>
        <CardTitle className="text-xl">{t("forgot.title")}</CardTitle>
        <CardDescription>{t("forgot.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={t("forgot.title")}
          className="flex flex-col gap-4"
        >
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
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("forgot.submit")}
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="font-semibold text-brand-mid hover:underline"
            >
              {t("forgot.backToLogin")}
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
