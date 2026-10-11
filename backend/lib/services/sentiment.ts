import axios from "axios";
import cron from "node-cron";
import { WebSocketServer } from "ws";
import { prisma } from "../prisma";
import { broadcast } from "../ws-server";
import { sendDiscordAlert } from "./notifications";

const KEYWORDS: Record<string, string[]> = {
  BTCUSDT: ["bitcoin", "BTC"],
  ETHUSDT: ["ethereum", "ETH"],
  SOLUSDT: ["solana", "SOL"],
  BNBUSDT: ["binance coin", "BNB"],
  ADAUSDT: ["cardano", "ADA"],
  DOTUSDT: ["polkadot", "DOT"],
};

const POS = ["surge", "rally", "bull", "gain", "rise", "adoption", "launch", "partnership", "upgrade", "record", "bullish", "approve"];
const NEG = ["crash", "fall", "bear", "drop", "hack", "ban", "regulation", "loss", "lawsuit", "fraud", "scam", "decline", "plunge"];

function score(text: string) {
  const t = text.toLowerCase();
  let s = 0;
  POS.forEach((w) => { if (t.includes(w)) s += 1; });
  NEG.forEach((w) => { if (t.includes(w)) s -= 1; });
  const norm = Math.max(-1, Math.min(1, s / 3));
  return { score: norm, label: norm > 0.2 ? "POSITIVE" : norm < -0.2 ? "NEGATIVE" : "NEUTRAL" };
}

async function run(wss: WebSocketServer) {
  for (const symbol of Object.keys(KEYWORDS)) {
    if (!process.env.NEWS_API_KEY) continue;
    try {
      const res = await axios.get("https://newsapi.org/v2/everything", {
        params: { q: KEYWORDS[symbol].join(" OR "), language: "en", sortBy: "publishedAt", pageSize: 5, apiKey: process.env.NEWS_API_KEY },
        timeout: 8000,
      });

      const articles = res.data.articles as { title: string; source: { name: string } }[];
      if (!articles.length) continue;

      const scores = articles.map((a) => ({ ...score(a.title), headline: a.title, source: a.source?.name }));
      const avg = scores.reduce((s, r) => s + r.score, 0) / scores.length;
      const label = avg > 0.15 ? "POSITIVE" : avg < -0.15 ? "NEGATIVE" : "NEUTRAL";

      await prisma.sentimentLog.create({
        data: { symbol, score: avg, label, headline: scores[0].headline, source: scores[0].source },
      });

      broadcast({ type: "sentiment_update", data: { symbol, score: avg, label, topHeadlines: scores.slice(0, 3), updatedAt: new Date().toISOString() } });

      if (label !== "NEUTRAL") {
        const alerts = await prisma.alert.findMany({
          where: { symbol, active: true, condition: label === "POSITIVE" ? "SENTIMENT_POSITIVE" : "SENTIMENT_NEGATIVE" },
        });
        for (const a of alerts) {
          await sendDiscordAlert(`📊 Sentimiento **${label}** en **${symbol}**: "${scores[0].headline}"`);
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export function startSentimentJob(wss: WebSocketServer) {
  run(wss);
  cron.schedule("*/15 * * * *", () => run(wss));
}
