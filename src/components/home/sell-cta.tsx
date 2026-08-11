/**
 * Sell-your-car CTA panel (P1-08) — navy Panel with an inverted primary
 * button leading into the sell wizard (/sell, task P1-02).
 */
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";

export function SellCta() {
  const { t } = useTranslation("home");

  return (
    <section aria-labelledby="sell-cta-heading" className="container-shell pb-12">
      <Panel className="flex flex-col items-start gap-4 border-brand bg-brand p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex flex-col gap-1">
          <h2 id="sell-cta-heading" className="text-xl font-extrabold text-white sm:text-2xl">
            {t("sellCta.heading")}
          </h2>
          <p className="max-w-xl text-sm text-white/80">{t("sellCta.copy")}</p>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0 bg-card text-brand hover:bg-brand-surface"
        >
          <Link href="/sell">
            {t("sellCta.button")}
            <ArrowRight className="rtl:-scale-x-100" aria-hidden />
          </Link>
        </Button>
      </Panel>
    </section>
  );
}
