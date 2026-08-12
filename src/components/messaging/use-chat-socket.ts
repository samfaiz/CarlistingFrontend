/**
 * Chat socket hook (task P2-02, FR-U3).
 *
 * One socket per signed-in session on the `/chat` namespace. The backend
 * broadcasts `message.created` for BOTH REST and socket sends, so this hook
 * never has to reconcile two delivery paths — everything arrives as
 * `message:new`. Delivery is best-effort: every handler is also reachable by
 * refetching, so a dropped socket degrades to "no live updates", never to a
 * missing message.
 */
import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

/** The socket lives on the API origin, not under the /api/v1 prefix. */
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

export interface ChatSocketHandlers {
  onMessage?: (event: { conversationId: string; messageId: string }) => void;
  onConversationUpdated?: (event: { conversationId: string; listingId: string }) => void;
  onTyping?: (event: { conversationId: string; userId: string; typing: boolean }) => void;
}

export function useChatSocket(
  accessToken: string | undefined,
  handlers: ChatSocketHandlers,
) {
  const socketRef = React.useRef<Socket | null>(null);
  const [connected, setConnected] = React.useState(false);

  // Handlers change on every render of the consumer; keeping them in a ref
  // means the socket is created once per token instead of reconnecting.
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${SOCKET_ORIGIN}/chat`, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("unauthorized", () => socket.disconnect());
    socket.on("message:new", (e) => handlersRef.current.onMessage?.(e));
    socket.on("conversation:updated", (e) =>
      handlersRef.current.onConversationUpdated?.(e),
    );
    socket.on("typing", (e) => handlersRef.current.onTyping?.(e));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken]);

  const joinConversation = React.useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", { conversationId });
  }, []);

  const sendTyping = React.useCallback((conversationId: string, typing: boolean) => {
    socketRef.current?.emit("typing", { conversationId, typing });
  }, []);

  return { connected, joinConversation, sendTyping };
}
