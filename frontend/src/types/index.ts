export interface PriceTick {
  symbol: string;
  price: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface SentimentData {
  score: number;
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  headline: string;
}

export interface Asset extends PriceTick {
  sentiment: SentimentData | null;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalInvested: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

export interface Alert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  active: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export type AlertCondition =
  | "PRICE_ABOVE"
  | "PRICE_BELOW"
  | "CHANGE_PERCENT_UP"
  | "CHANGE_PERCENT_DOWN"
  | "SENTIMENT_NEGATIVE"
  | "SENTIMENT_POSITIVE";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface WsMessage {
  type: "price_tick" | "sentiment_update" | "alert_triggered" | "connected";
  data?: unknown;
  message?: string;
}
