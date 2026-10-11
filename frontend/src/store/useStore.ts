import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Asset, Holding, Trade, Alert, User } from "../types";

interface Notification {
  symbol: string;
  message: string;
  timestamp: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  balance: number;
  assets: Record<string, Asset>;
  holdings: Holding[];
  trades: Trade[];
  alerts: Alert[];
  notifications: Notification[];
  wsConnected: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateAsset: (asset: Asset) => void;
  updateSentiment: (symbol: string, s: Asset["sentiment"]) => void;
  setPortfolio: (holdings: Holding[], balance: number) => void;
  setTrades: (trades: Trade[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  addNotification: (n: Notification) => void;
  setWsConnected: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      balance: 0,
      assets: {},
      holdings: [],
      trades: [],
      alerts: [],
      notifications: [],
      wsConnected: false,

      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, balance: 0, holdings: [], trades: [], alerts: [] }),

      updateAsset: (asset) =>
        set((s) => ({ assets: { ...s.assets, [asset.symbol]: { ...s.assets[asset.symbol], ...asset } } })),

      updateSentiment: (symbol, sentiment) =>
        set((s) => ({ assets: { ...s.assets, [symbol]: { ...s.assets[symbol], sentiment } } })),

      setPortfolio: (holdings, balance) => set({ holdings, balance }),
      setTrades: (trades) => set({ trades }),
      setAlerts: (alerts) => set({ alerts }),

      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications].slice(0, 30) })),
      setWsConnected: (wsConnected) => set({ wsConnected }),
    }),
    { name: "ff-store", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
