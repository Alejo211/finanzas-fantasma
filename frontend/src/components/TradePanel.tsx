import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useStore } from "../store/useStore";
import type { Asset } from "../types";

interface Props {
  asset: Asset;
  onDone: () => void;
}

export function TradePanel({ asset, onDone }: Props) {
  const { executeTrade, getPortfolio, getTrades } = useApi();
  const { balance, holdings, setPortfolio, setTrades } = useStore();
  const holding = holdings.find((h) => h.symbol === asset.symbol);

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = asset.price ?? 0;
  const total = price * (parseFloat(qty) || 0);
  const maxBuy = balance / price;
  const maxSell = holding?.quantity ?? 0;

  const handle = async () => {
    setError("");
    const q = parseFloat(qty);
    if (!q || q <= 0) return setError("Cantidad inválida");
    setLoading(true);
    try {
      const res = await executeTrade({ symbol: asset.symbol, name: asset.symbol.replace("USDT", ""), side, quantity: q });
      const portfolio = await getPortfolio();
      const trades = await getTrades();
      setPortfolio(portfolio.holdings, res.balance);
      setTrades(trades);
      setQty("");
      onDone();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Error al ejecutar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-lg">{asset.symbol.replace("USDT", "")}</h3>
          <p className="text-2xl font-bold text-white">${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <span className={`text-sm font-medium ${asset.changePercent24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {asset.changePercent24h >= 0 ? "+" : ""}{asset.changePercent24h?.toFixed(2)}%
        </span>
      </div>

      <div className="flex rounded-xl bg-white/5 p-1 mb-4">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setQty(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              side === s
                ? s === "BUY" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {s === "BUY" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {s === "BUY" ? "Comprar" : "Vender"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{side === "BUY" ? "Saldo disponible" : "En cartera"}</span>
          <span className="text-white font-medium">
            {side === "BUY"
              ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `${maxSell.toFixed(6)} ${asset.symbol.replace("USDT", "")}`}
          </span>
        </div>

        <div className="relative">
          <input
            type="number"
            className="input-dark w-full pr-16"
            placeholder="Cantidad"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            step="any"
            min="0"
          />
          <button
            onClick={() => setQty(side === "BUY" ? maxBuy.toFixed(6) : maxSell.toFixed(6))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300"
          >
            MÁX
          </button>
        </div>

        <div className="flex gap-2">
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <button
              key={pct}
              onClick={() => setQty(((side === "BUY" ? maxBuy : maxSell) * pct).toFixed(6))}
              className="flex-1 text-xs py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              {pct * 100}%
            </button>
          ))}
        </div>
      </div>

      {parseFloat(qty) > 0 && (
        <div className="bg-white/5 rounded-xl p-3 mb-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Total</span>
            <span className="text-white font-bold">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button
        onClick={handle}
        disabled={loading || !qty}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === "BUY"
            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-red-600 hover:bg-red-500 text-white"
        }`}
      >
        {loading ? "Ejecutando..." : `${side === "BUY" ? "Comprar" : "Vender"} ${asset.symbol.replace("USDT", "")}`}
      </button>
    </div>
  );
}
