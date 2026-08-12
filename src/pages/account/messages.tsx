/**
 * /account/messages — task P2-02 (FR-U3).
 *
 * Master/detail inbox: thread list on the start side, the open conversation on
 * the end side; on mobile the list collapses once a thread is open. Live
 * updates come from the /chat socket, but every socket event only triggers a
 * refetch — the API stays the single source of truth, so a dropped socket
 * costs liveness, never correctness.
 *
 * Protection mirrors /account/saved: SSR redirect (works without JS) plus
 * client useSession.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { ArrowLeft, Loader2, MessageCircle, Wifi, WifiOff } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { ConversationList } from "@/components/messaging/conversation-list";
import { MessageThread } from "@/components/messaging/message-thread";
import { useChatSocket } from "@/components/messaging/use-chat-socket";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  getConversations,
  type ConversationSummary,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MessagesPage() {
  const { t } = useTranslation("messages");
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const accessToken = session?.accessToken;
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [threadRefresh, setThreadRefresh] = React.useState(0);

  const queryId = typeof router.query.c === "string" ? router.query.c : null;

  const refresh = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const rows = await getConversations(accessToken);
      setConversations(rows);
    } catch {
      toast({ title: t("errors.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // Deep link (?c=) wins; otherwise open the newest thread on desktop.
  React.useEffect(() => {
    if (queryId) setActiveId(queryId);
  }, [queryId]);

  const { connected } = useChatSocket(accessToken, {
    onMessage: (e) => {
      if (e.conversationId === activeId) setThreadRefresh((n) => n + 1);
      void refresh();
    },
    onConversationUpdated: () => void refresh(),
  });

  const select = (id: string) => {
    setActiveId(id);
    void router.push({ query: { ...router.query, c: id } }, undefined, {
      shallow: true,
    });
  };

  const active = conversations.find((c) => c.id === activeId) ?? null;

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-ink">{t("heading")}</h1>
          <span
            className="inline-flex items-center gap-1.5 text-xs text-muted"
            title={connected ? t("status.live") : t("status.offline")}
          >
            {connected ? (
              <Wifi className="size-3.5 text-success-strong" aria-hidden />
            ) : (
              <WifiOff className="size-3.5" aria-hidden />
            )}
            {connected ? t("status.live") : t("status.offline")}
          </span>
        </div>

        {loading ? (
          <Panel className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("loading")}
          </Panel>
        ) : conversations.length === 0 ? (
          <Panel className="flex flex-col items-center gap-3 p-10 text-center">
            <MessageCircle className="size-8 text-muted" aria-hidden />
            <p className="text-sm font-bold text-ink">{t("empty.title")}</p>
            <p className="max-w-sm text-sm text-muted">{t("empty.hint")}</p>
            <Button onClick={() => void router.push("/cars")}>{t("empty.cta")}</Button>
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <Panel
              className={cn(
                "overflow-hidden p-0",
                // On mobile the list steps aside once a thread is open.
                active && "hidden md:block",
              )}
            >
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={select}
              />
            </Panel>

            <Panel className={cn("min-h-[60vh] p-0", !active && "hidden md:block")}>
              {active && accessToken && currentUserId ? (
                <div className="flex h-full flex-col">
                  <div className="md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveId(null);
                        const rest = { ...router.query };
                        delete rest.c;
                        void router.push({ query: rest }, undefined, { shallow: true });
                      }}
                    >
                      <ArrowLeft aria-hidden />
                      {t("thread.back")}
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <MessageThread
                      conversation={active}
                      accessToken={accessToken}
                      currentUserId={currentUserId}
                      refreshKey={threadRefresh}
                      onChanged={() => void refresh()}
                    />
                  </div>
                </div>
              ) : (
                <p className="p-10 text-center text-sm text-muted">
                  {t("thread.pickOne")}
                </p>
              )}
            </Panel>
          </div>
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
      redirect: { destination: `${prefix}/login?next=/account/messages`, permanent: false },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "messages", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
