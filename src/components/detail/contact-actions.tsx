/**
 * Seller contact actions on the listing detail — tasks P2-02/P2-03
 * (FR-U3 chat, FR-D2 leads, FR-D6 contact privacy).
 *
 * The phone number is NEVER rendered until the user asks for it: it arrives
 * from POST /reveal-contact on click, which is also the moment the lead is
 * recorded. Signed-out visitors can still call — only chat requires an account.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { Loader2, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  openConversation,
  revealContact,
  type RevealedContact,
} from "@/lib/marketplace-api";

export interface ContactActionsProps {
  listingId: string;
  /** Coarse attribution for the lead row. */
  source?: string;
}

export function ContactActions({ listingId, source = "detail" }: ContactActionsProps) {
  const { t } = useTranslation("detail");
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [revealed, setRevealed] = React.useState<RevealedContact | null>(null);
  const [revealing, setRevealing] = React.useState(false);
  const [chatting, setChatting] = React.useState(false);

  const handleReveal = async () => {
    if (revealing) return;
    setRevealing(true);
    try {
      const contact = await revealContact(listingId, "CALL", { accessToken, source });
      if (!contact.phone) {
        toast({ title: t("contact.noPhone"), variant: "warning" });
        return;
      }
      setRevealed(contact);
    } catch {
      toast({ title: t("contact.revealFailed"), variant: "warning" });
    } finally {
      setRevealing(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const contact = await revealContact(listingId, "WHATSAPP", { accessToken, source });
      if (!contact.whatsappUrl) {
        toast({ title: t("contact.noPhone"), variant: "warning" });
        return;
      }
      window.open(contact.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: t("contact.revealFailed"), variant: "warning" });
    }
  };

  const handleChat = async () => {
    if (!accessToken) {
      void router.push(
        `/login?next=${encodeURIComponent(router.asPath)}`,
      );
      return;
    }
    setChatting(true);
    try {
      const convo = await openConversation(listingId, accessToken);
      void router.push(`/account/messages?c=${convo.id}`);
    } catch {
      toast({ title: t("contact.chatFailed"), variant: "warning" });
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => void handleChat()} disabled={chatting}>
          {chatting ? <Loader2 className="animate-spin" aria-hidden /> : <MessageCircle aria-hidden />}
          {t("contact.chat")}
        </Button>

        {revealed?.phone ? (
          <Button variant="secondary" asChild>
            <a href={`tel:${revealed.phone}`}>
              <Phone aria-hidden />
              {revealed.phone}
            </a>
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void handleReveal()} disabled={revealing}>
            {revealing ? <Loader2 className="animate-spin" aria-hidden /> : <Phone aria-hidden />}
            {t("contact.showNumber")}
          </Button>
        )}
      </div>

      <Button variant="outline" onClick={() => void handleWhatsApp()}>
        {t("contact.whatsapp")}
      </Button>
    </div>
  );
}
