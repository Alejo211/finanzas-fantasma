import axios from "axios";
import { useStore } from "../store/useStore";

const BASE = import.meta.env.VITE_API_URL || "";

export function useApi() {
  const token = useStore((s) => s.token);
  const h = token ? { Authorization: `Bearer ${token}` } : {};
  const c = axios.create({ baseURL: BASE, headers: h });

  return {
    login: (email: string, password: string) =>
      c.post("/api/auth", { action: "login", email, password }).then((r) => r.data),
    register: (email: string, password: string, name: string) =>
      c.post("/api/auth", { action: "register", email, password, name }).then((r) => r.data),

    getAssets: () => c.get("/api/assets").then((r) => r.data.assets),
    getPortfolio: () => c.get("/api/portfolio").then((r) => r.data),
    getTrades: () => c.get("/api/trade").then((r) => r.data.trades),
    executeTrade: (data: { symbol: string; name: string; side: "BUY" | "SELL"; quantity: number }) =>
      c.post("/api/trade", data).then((r) => r.data),

    getAlerts: () => c.get("/api/alerts").then((r) => r.data.alerts),
    createAlert: (data: object) => c.post("/api/alerts", data).then((r) => r.data.alert),
    toggleAlert: (id: string, active: boolean) => c.patch("/api/alerts", { id, active }),
    deleteAlert: (id: string) => c.delete(`/api/alerts?id=${id}`),

    getNews: () => c.get("/api/news").then((r) => r.data.logs),
  };
}
