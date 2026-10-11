import { useEffect, useState } from "react";
import { Ghost, Wifi, WifiOff, LogOut, LayoutDashboard, Briefcase, Bell, Newspaper, History } from "lucide-react";
import { useStore } from "./store/useStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { useApi } from "./hooks/useApi";
import { PriceCard } from "./components/PriceCard";
import { LiveChart } from "./components/LiveChart";
import { TradePanel } from "./components/TradePanel";
import { AlertManager } from "./components/AlertForm";
import { AuthModal } from "./components/AuthModal";
import { NotificationBell } from "./components/Notifications";
import type { Asset } from "./types";

type Tab = "market" | "portfolio" | "alerts" | "history" | "news";

export default function App() {
  const { user, assets, wsConnected, holdings, trades, balance, logout, setPortfolio, setTrades, setAlerts, addNotification } = useStore();
  const [tab, setTab] = useState<Tab>("market");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [news, setNews] = useState<{ symbol: string; label: string; headline: string; createdAt: string }[]>([]);
  const api = useApi();

  useWebSocket();

  useEffect(() => { if (Notification.permission === "default") Notification.requestPermission(); }, []);

  useEffect(() => {
    api.getAssets().then((a: Asset[]) => a.forEach((asset) => useStore.getState().updateAsset(asset)));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getPortfolio().then((r) => setPortfolio(r.holdings, r.balance));
    api.getTrades().then(setTrades);
    api.getAlerts().then(setAlerts);
  }, [user]);

  useEffect(() => {
    if (tab === "news") api.getNews().then(setNews);
  }, [tab]);

  if (!user) return <AuthModal />;

  const assetList = Object.values(assets).sort((a, b) => b.volume24h - a.volume24h);
  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0);
  const totalPortfolio = balance + totalValue;

  const TABS = [
    { id: "market" as Tab, label: "Mercado", icon: LayoutDashboard },
    { id: "portfolio" as Tab, label: "Portafolio", icon: Briefcase },
    { id: "alerts" as Tab, label: "Alertas", icon: Bell },
    { id: "history" as Tab, label: "Historial", icon: History },
    { id: "news" as Tab, label: "Noticias", icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-[#080d1a]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <Ghost size={20} className="text-violet-400" />
          <span className="font-bold text-white hidden sm:block">Finanzas Fantasma</span>
          <div className={`flex items-center gap-1 text-xs ${wsConnected ? "text-emerald-400" : "text-red-400"}`}>
            {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {wsConnected ? "Live" : "—"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Portafolio total</p>
            <p className="text-sm font-bold text-white">${totalPortfolio.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <NotificationBell />
          <button onClick={logout} className="p-2 text-slate-500 hover:text-white transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <nav className="border-b border-white/10 px-4 flex gap-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === id ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400 hover:text-white"}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-5">

        {/* MERCADO */}
        {tab === "market" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {assetList.length === 0
                  ? <p className="col-span-full text-center text-slate-500 py-8 text-sm">Conectando al mercado en tiempo real...</p>
                  : assetList.map((a) => (
                    <PriceCard key={a.symbol} asset={a} selected={selected?.symbol === a.symbol} onClick={() => setSelected(a.symbol === selected?.symbol ? null : a)} />
                  ))}
              </div>
              {selected && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-slate-400">Precio en vivo</p>
                      <p className="text-2xl font-bold text-white">${assets[selected.symbol]?.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400 space-y-0.5">
                      <p>24h H: ${assets[selected.symbol]?.high24h?.toLocaleString()}</p>
                      <p>24h L: ${assets[selected.symbol]?.low24h?.toLocaleString()}</p>
                    </div>
                  </div>
                  <LiveChart symbol={selected.symbol} />
                  {assets[selected.symbol]?.sentiment?.headline && (
                    <p className="mt-3 text-xs text-slate-500 border-t border-white/5 pt-3">
                      📰 {assets[selected.symbol].sentiment?.headline}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <p className="text-xs text-slate-400 mb-1">Saldo disponible</p>
                <p className="text-2xl font-bold text-white">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                {totalPnl !== 0 && (
                  <p className={`text-sm mt-1 ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    P&L total: {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              {selected && assets[selected.symbol] ? (
                <TradePanel asset={assets[selected.symbol]} onDone={() => {}} />
              ) : (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center text-slate-500 text-sm">
                  Selecciona un activo para operar
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTAFOLIO */}
        {tab === "portfolio" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Saldo libre", val: `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                { label: "En activos", val: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                { label: "P&L total", val: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className={`text-sm font-bold mt-1 ${s.color || "text-white"}`}>{s.val}</p>
                </div>
              ))}
            </div>
            {holdings.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No tienes activos aún. Ve al mercado y compra algo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-white/10">
                      <th className="text-left py-2">Activo</th>
                      <th className="text-right py-2">Cantidad</th>
                      <th className="text-right py-2">Precio med.</th>
                      <th className="text-right py-2">Precio actual</th>
                      <th className="text-right py-2">Valor</th>
                      <th className="text-right py-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => { setSelected(assets[h.symbol] ?? null); setTab("market"); }}>
                        <td className="py-3 font-medium text-white">{h.symbol.replace("USDT", "")}</td>
                        <td className="text-right text-slate-300">{h.quantity.toFixed(6)}</td>
                        <td className="text-right text-slate-300">${h.avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right text-white">${h.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right text-white">${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className={`text-right font-medium ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {h.pnlPercent >= 0 ? "+" : ""}{h.pnlPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {tab === "history" && (
          <div className="space-y-3 max-w-2xl">
            {trades.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">Sin operaciones todavía.</p>
            ) : trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-xl border border-white/10 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.side === "BUY" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                      {t.side === "BUY" ? "COMPRA" : "VENTA"}
                    </span>
                    <span className="text-sm font-medium text-white">{t.symbol.replace("USDT", "")}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{new Date(t.createdAt).toLocaleString("es-EC")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">${t.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-400">{t.quantity.toFixed(6)} @ ${t.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALERTAS */}
        {tab === "alerts" && (
          <div className="max-w-xl space-y-3">
            <p className="text-xs text-slate-400">Las alertas también se envían a Discord si configuras el webhook en el `.env`.</p>
            <AlertManager />
          </div>
        )}

        {/* NOTICIAS */}
        {tab === "news" && (
          <div className="max-w-2xl space-y-3">
            {news.length === 0
              ? <p className="text-slate-500 text-sm text-center py-8">Sin datos. El job corre cada 15 min.</p>
              : news.map((n, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{n.symbol.replace("USDT", "")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${n.label === "POSITIVE" ? "bg-emerald-400/10 text-emerald-400" : n.label === "NEGATIVE" ? "bg-red-400/10 text-red-400" : "bg-slate-400/10 text-slate-400"}`}>
                      {n.label}
                    </span>
                  </div>
                  <p className="text-sm text-white">{n.headline}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString("es-EC")}</p>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
