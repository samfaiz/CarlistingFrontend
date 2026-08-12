/**
 * /account/notifications — task P2-04/P2-05 (FR-U4).
 *
 * The in-app inbox plus the per-event × per-channel preference matrix. The
 * backend stores opt-OUTs, so every switch starts on and a new event type
 * needs no migration here — the matrix is rendered from whatever the API
 * returns.
 *
 * Also the landing page for the "Manage notification settings" link in every
 * notification email.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { BellRing, Check, Loader2, Mail, Monitor } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  getNotificationPreferences,
  getNotifications,
  markNotificationsRead,
  setNotificationPreference,
  type NotificationPreference,
  type NotificationRow,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

/** Where each notification type sends the user when clicked. */
function hrefFor(row: NotificationRow): string {
  const p = row.payload ?? {};
  switch (row.type) {
    case "MESSAGE_RECEIVED":
      return `/account/messages?c=${p.conversationId ?? ""}`;
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
    case "LISTING_EXPIRING":
      return "/account/listings";
    case "SAVED_SEARCH_MATCH":
      return "/account/saved";
    case "PRICE_DROP":
      return p.slug ? `/cars/${p.slug}` : "/account/saved";
    default:
      return "/account";
  }
}

export default function NotificationsPage() {
  const { t } = useTranslation("account");
  const { data: session } = useSession({ required: true });
  const accessToken = session?.accessToken;

  const [rows, setRows] = React.useState<NotificationRow[]>([]);
  const [prefs, setPrefs] = React.useState<NotificationPreference[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const [inbox, preferences] = await Promise.all([
        getNotifications(accessToken),
        getNotificationPreferences(accessToken),
      ]);
      setRows(inbox);
      setPrefs(preferences);
    } catch {
      toast({ title: t("notifications.errors.load"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /**
   * Optimistic: the switch flips immediately and rolls back if the API refuses.
   * Waiting for the round trip made the control look like it ignored the first
   * click (caught by the P2 E2E, which clicked and saw no state change).
   */
  const toggle = async (
    event: string,
    channel: "IN_APP" | "EMAIL",
    enabled: boolean,
  ) => {
    const key = `${event}:${channel}`;
    const previous = prefs;
    setPrefs((rows) =>
      rows.map((row) =>
        row.event === event
          ? {
              ...row,
              channels: row.channels.map((c) =>
                c.channel === channel ? { ...c, enabled } : c,
              ),
            }
          : row,
      ),
    );
    setSavingKey(key);
    try {
      const updated = await setNotificationPreference(
        { event, channel, enabled },
        accessToken!,
      );
      setPrefs(updated);
    } catch {
      setPrefs(previous);
      toast({ title: t("notifications.errors.save"), variant: "warning" });
    } finally {
      setSavingKey(null);
    }
  };

  const unread = rows.filter((r) => !r.readAt).length;

  return (
    <>
      <Head>
        <title>{t("notifications.meta.title")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-ink">{t("notifications.heading")}</h1>
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await markNotificationsRead(accessToken!);
                await load();
              }}
            >
              <Check aria-hidden />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {loading ? (
          <Panel className="mt-4 flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("notifications.loading")}
          </Panel>
        ) : (
          <>
            <Panel className="mt-4 overflow-hidden p-0">
              {rows.length === 0 ? (
                <p className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
                  <BellRing className="size-7" aria-hidden />
                  {t("notifications.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-divider">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={hrefFor(row)}
                        className={cn(
                          "flex items-start justify-between gap-3 p-4 transition-colors hover:bg-page",
                          !row.readAt && "bg-brand-surface",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-ink">
                            {t(`notifications.events.${row.type}.title`, {
                              defaultValue: row.type,
                            })}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {row.payload?.preview ??
                              row.payload?.searchName ??
                              row.payload?.slug ??
                              ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted">
                          {formatRelativeTime(row.createdAt, "en")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <h2 className="mt-8 text-lg font-bold text-ink">
              {t("notifications.prefs.heading")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("notifications.prefs.hint")}</p>

            <Panel className="mt-3 overflow-x-auto p-0">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="bg-brand text-white">
                    <th scope="col" className="p-3 text-start font-semibold">
                      {t("notifications.prefs.event")}
                    </th>
                    <th scope="col" className="p-3 text-center font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Monitor className="size-4" aria-hidden />
                        {t("notifications.prefs.inApp")}
                      </span>
                    </th>
                    <th scope="col" className="p-3 text-center font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="size-4" aria-hidden />
                        {t("notifications.prefs.email")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prefs.map((pref, i) => (
                    <tr key={pref.event} className={i % 2 === 1 ? "bg-page" : undefined}>
                      <th scope="row" className="p-3 text-start font-medium text-ink">
                        {t(`notifications.events.${pref.event}.title`, {
                          defaultValue: pref.event,
                        })}
                      </th>
                      {(["IN_APP", "EMAIL"] as const).map((channel) => {
                        const ch = pref.channels.find((c) => c.channel === channel);
                        if (!ch) return <td key={channel} className="p-3 text-center text-muted">—</td>;
                        const key = `${pref.event}:${channel}`;
                        return (
                          <td key={channel} className="p-3 text-center">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                className="size-4 accent-[var(--color-brand)]"
                                checked={ch.enabled}
                                disabled={pref.mandatory}
                                onChange={(e) =>
                                  void toggle(pref.event, channel, e.target.checked)
                                }
                              />
                              <span className="sr-only">
                                {t("notifications.prefs.toggleLabel", {
                                  event: t(`notifications.events.${pref.event}.title`, {
                                    defaultValue: pref.event,
                                  }),
                                  channel: t(
                                    channel === "EMAIL"
                                      ? "notifications.prefs.email"
                                      : "notifications.prefs.inApp",
                                  ),
                                })}
                              </span>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: {
        destination: `${prefix}/login?next=/account/notifications`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "account", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
