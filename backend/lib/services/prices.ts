import { WebSocket as BinanceWS } from "ws";
import { WebSocketServer } from "ws";
import { broadcastToSymbol } from "../ws-server";
import { checkAlerts } from "./alerts";

export interface PriceTick {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

const SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "bnbusdt", "adausdt", "dotusdt"];
declare global { var __priceCache: Map<string, PriceTick> | undefined; }
const priceCache: Map<string, PriceTick> = global.__priceCache ?? new Map();
global.__priceCache = priceCache;

export function getPriceCache() {
  return priceCache;
}

export function startPriceStreamer(wss: WebSocketServer) {
  const streams = SYMBOLS.map((s) => `${s}@ticker`).join("/");
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  function connect() {
    const binanceWs = new BinanceWS(url);

    binanceWs.on("open", () => {
      console.log("📡 Conectado a Binance WebSocket");
    });

    binanceWs.on("message", async (raw: Buffer) => {
      try {
        const outer = JSON.parse(raw.toString());
        const d = outer.data;
        if (!d) return;

        const tick: PriceTick = {
          symbol: d.s,
          price: parseFloat(d.c),
          change24h: parseFloat(d.P),
          changePercent24h: parseFloat(d.P),
          volume24h: parseFloat(d.v),
          high24h: parseFloat(d.h),
          low24h: parseFloat(d.l),
          timestamp: Date.now(),
        };

        priceCache.set(tick.symbol, tick);

        broadcastToSymbol(tick.symbol, { type: "price_tick", data: tick });

        await checkAlerts(tick);
      } catch {}
    });

    binanceWs.on("error", (err) => {
      console.error("Binance WS error:", err.message);
    });

    binanceWs.on("close", () => {
      console.warn("Binance WS cerrado, reconectando en 5s...");
      setTimeout(connect, 5_000);
    });
  }

  connect();
}
