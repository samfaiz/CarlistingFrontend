/**
 * One conversation: header (counterpart + listing link + block action), the
 * message list and the composer — task P2-02 (FR-U3).
 *
 * The thread owns its own fetch/refetch so the socket only has to say "this
 * conversation changed"; the authoritative message list always comes from the
 * API. Safety copy (never wire money before seeing the car) is permanent, not
 * dismissible — it is the anti-fraud surface required by PRD §13.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { AlertTriangle, Ban, Loader2, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  blockUser,
  getMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/marketplace-api";

export interface MessageThreadProps {
  conversation: ConversationSummary;
  accessToken: string;
  currentUserId: string;
  /** Bumped by the socket when this thread receives a message. */
  refreshKey: number;
  /** Lets the page refresh unread badges after a read/send. */
  onChanged: () => void;
}

const MAX_LENGTH = 4000;

export function MessageThread({
  conversation,
  accessToken,
  currentUserId,
  refreshKey,
  onChanged,
}: MessageThreadProps) {
  const { t } = useTranslation("messages");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [blocked, setBlocked] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  const listingTitle = `${conversation.listing.year} ${conversation.listing.make.name} ${conversation.listing.model.name}`;

  const load = React.useCallback(async () => {
    try {
      const res = await getMessages(conversation.id, accessToken);
      setMessages(res.messages);
    } catch {
      toast({ title: t("errors.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [conversation.id, accessToken, t]);

  React.useEffect(() => {
    setLoading(true);
    setBlocked(false);
    void load();
  }, [load, refreshKey]);

  // Opening a thread marks it read — the badge should never survive reading.
  React.useEffect(() => {
    if (loading || conversation.unread === 0) return;
    void markConversationRead(conversation.id, accessToken).then(onChanged);
  }, [loading, conversation.id, conversation.unread, accessToken, onChanged]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const created = await sendMessage(conversation.id, body, accessToken);
      setMessages((prev) => [...prev, created]);
      setDraft("");
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setBlocked(true);
        toast({ title: t("errors.blocked"), variant: "warning" });
      } else {
        toast({ title: t("errors.sendFailed"), variant: "warning" });
      }
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(conversation.counterpart.id, accessToken);
      setBlocked(true);
      toast({ title: t("block.done"), variant: "success" });
      onChanged();
    } catch {
      toast({ title: t("errors.blockFailed"), variant: "warning" });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-divider p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {conversation.counterpart.name}
          </p>
          <Link
            href={`/cars/${conversation.listing.slug}`}
            className="truncate text-xs text-brand-mid underline-offset-2 hover:underline"
          >
            {listingTitle} · {formatPrice(conversation.listing.priceAed, locale)}
          </Link>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void handleBlock()}>
          <Ban aria-hidden />
          {t("block.action")}
        </Button>
      </header>

      <p className="flex items-start gap-2 bg-page px-4 py-2 text-[11px] text-muted-strong">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning-strong" aria-hidden />
        {t("safety")}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("loading")}
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">{t("thread.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <li
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-card px-3 py-2 text-sm",
                      mine ? "bg-brand text-white" : "bg-page text-ink",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        mine ? "text-white/70" : "text-muted",
                      )}
                    >
                      {formatRelativeTime(m.createdAt, locale)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <p className="flex items-center gap-2 border-t border-divider p-4 text-sm text-muted">
          <AlertTriangle className="size-4 text-warning-strong" aria-hidden />
          {t("block.notice")}
        </p>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-divider p-3">
          <label htmlFor="chat-composer" className="sr-only">
            {t("composer.label")}
          </label>
          <Textarea
            id="chat-composer"
            rows={2}
            maxLength={MAX_LENGTH}
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              // Enter sends, Shift+Enter newlines — the convention every chat user expects.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={t("composer.placeholder")}
            className="min-h-[44px] flex-1 resize-none"
          />
          <Button type="submit" disabled={!draft.trim() || sending}>
            {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            <span className="sr-only sm:not-sr-only">{t("composer.send")}</span>
          </Button>
        </form>
      )}
    </div>
  );
}
