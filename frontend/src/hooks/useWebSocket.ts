import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import type { WsMessage, Asset, AlertTriggered } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

export function useWebSocket() {
  const token = useStore((s) => s.token);
  const updateAsset = useStore((s) => s.updateAsset);
  const updateSentiment = useStore((s) => s.updateSentiment);
  const addNotification = useStore((s) => s.addNotification);
  const setWsConnected = useStore((s) => s.setWsConnected);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      const url = `${WS_URL}/ws${token ? `?token=${token}` : ""}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (retryRef.current) clearTimeout(retryRef.current);
      };

      ws.onmessage = (evt) => {
        try {
          const msg: WsMessage = JSON.parse(evt.data);

          if (msg.type === "price_tick") {
            updateAsset(msg.data as Asset);
          }

          if (msg.type === "sentiment_update") {
            const d = msg.data as { symbol: string; score: number; label: string; topHeadlines: { headline: string }[] };
            updateSentiment(d.symbol, {
              score: d.score,
              label: d.label as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
              headline: d.topHeadlines?.[0]?.headline || "",
            });
          }

          if (msg.type === "alert_triggered") {
            addNotification(msg.data as AlertTriggered);
            // Notificación del navegador
            if (Notification.permission === "granted") {
              const d = msg.data as AlertTriggered;
              new Notification("Finanzas Fantasma 🚨", { body: d.message.replace(/\*/g, "") });
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        retryRef.current = setTimeout(connect, 4_000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [token]);

  return wsRef;
}
