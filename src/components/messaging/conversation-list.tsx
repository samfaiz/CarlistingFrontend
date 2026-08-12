/**
 * Thread list for /account/messages (task P2-02, FR-U3).
 *
 * Each row is a button (not a link): selecting a thread swaps the panel and
 * pushes a shallow ?c= so the URL is shareable/back-navigable without an SSR
 * round-trip.
 */
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelativeTime, mediaUrl } from "@/lib/format";
import type { ConversationSummary } from "@/lib/marketplace-api";

export interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  const { t } = useTranslation("messages");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  return (
    <ul className="divide-y divide-divider" aria-label={t("list.label")}>
      {conversations.map((c) => {
        const cover = c.listing.media?.[0]?.variants as
          | { thumb?: string }
          | undefined;
        const title = `${c.listing.year} ${c.listing.make.name} ${c.listing.model.name}`;
        const isActive = c.id === activeId;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex w-full items-start gap-3 p-3 text-start transition-colors",
                "hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                isActive && "bg-page",
              )}
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-page">
                {cover?.thumb ? (
                  <Image
                    src={mediaUrl(cover.thumb)}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <Car className="absolute inset-0 m-auto size-5 text-muted" aria-hidden />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">
                    {c.counterpart.name}
                  </span>
                  {c.lastMessageAt && (
                    <span className="shrink-0 text-[11px] text-muted">
                      {formatRelativeTime(c.lastMessageAt, locale)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">{title}</span>
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-strong">
                    {c.lastMessage?.body ?? t("list.noMessages")}
                  </span>
                  {c.unread > 0 && (
                    <span
                      className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white"
                      aria-label={t("list.unreadCount", { count: c.unread })}
                    >
                      {c.unread}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-brand-mid">
                  {formatPrice(c.listing.priceAed, locale)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
