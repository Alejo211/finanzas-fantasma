import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { verifyToken } from "./auth";

export type WsClient = WebSocket & {
  userId?: string;
  subscribedSymbols?: Set<string>;
  isAlive?: boolean;
};

let wss: WebSocketServer;

export function initWebSocketServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WsClient, req: IncomingMessage) => {
    ws.isAlive = true;
    ws.subscribedSymbols = new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);

    const token = new URL(req.url!, "ws://localhost").searchParams.get("token");
    if (token) {
      try {
        const payload = verifyToken(token);
        ws.userId = payload.userId;
      } catch {
        // sesión sin auth, solo precios públicos
      }
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe" && Array.isArray(msg.symbols)) {
          msg.symbols.forEach((s: string) => ws.subscribedSymbols?.add(s.toUpperCase()));
        }
        if (msg.type === "unsubscribe" && Array.isArray(msg.symbols)) {
          msg.symbols.forEach((s: string) => ws.subscribedSymbols?.delete(s.toUpperCase()));
        }
      } catch {}
    });

    sendToClient(ws, { type: "connected", message: "Finanzas Fantasma WS listo 🚀" });
  });

  // heartbeat para detectar clientes muertos
  const interval = setInterval(() => {
    wss.clients.forEach((rawWs) => {
      const ws = rawWs as WsClient;
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

export function broadcast(payload: object, filter?: (ws: WsClient) => boolean) {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((rawWs) => {
    const ws = rawWs as WsClient;
    if (ws.readyState !== WebSocket.OPEN) return;
    if (filter && !filter(ws)) return;
    ws.send(data);
  });
}

export function broadcastToSymbol(symbol: string, payload: object) {
  broadcast(payload, (ws) => ws.subscribedSymbols?.has(symbol) ?? false);
}

export function sendToUser(userId: string, payload: object) {
  broadcast(payload, (ws) => ws.userId === userId);
}

export function sendToClient(ws: WsClient, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
