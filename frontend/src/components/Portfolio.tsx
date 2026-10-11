import { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useStore } from "../store/useStore";

export function Portfolio() {
  const { addToPortfolio, removeFromPortfolio, getPortfolio } = useApi();
  const portfolio = useStore((s) => s.portfolio);
  const setPortfolio = useStore((s) => s.setPortfolio);
  const [form, setForm] = useState({ symbol: "BTCUSDT", name: "Bitcoin", quantity: "", avgPrice: "" });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const totalInvested = portfolio.reduce((s, i) => s + i.totalInvested, 0);
  const totalValue = portfolio.reduce((s, i) => s + i.totalValue, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addToPortfolio({
        symbol: form.symbol.toUpperCase(),
        name: form.name,
        quantity: parseFloat(form.quantity),
        avgPrice: parseFloat(form.avgPrice),
      });
      const updated = await getPortfolio();
      setPortfolio(updated);
      setShowForm(false);
      setForm({ symbol: "BTCUSDT", name: "Bitcoin", quantity: "", avgPrice: "" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    await removeFromPortfolio(id);
    setPortfolio(portfolio.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Invertido", value: `$${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Valor actual", value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          {
            label: "P&L",
            value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${totalPnlPct.toFixed(2)}%)`,
            color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-sm font-bold mt-1 ${s.color || "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* tabla */}
      {portfolio.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-white/10">
                <th className="text-left py-2">Activo</th>
                <th className="text-right py-2">Cantidad</th>
                <th className="text-right py-2">Precio actual</th>
                <th className="text-right py-2">Valor</th>
                <th className="text-right py-2">P&L</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3">
                    <p className="font-medium text-white">{item.symbol.replace("USDT", "")}</p>
                    <p className="text-xs text-slate-500">{item.name}</p>
                  </td>
                  <td className="text-right text-white">{item.quantity}</td>
                  <td className="text-right text-white">
                    ${item.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right text-white">
                    ${item.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right ${item.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    <div className="flex items-center justify-end gap-1">
                      {item.pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {item.pnlPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* form agregar */}
      {showForm ? (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-dark"
              placeholder="Símbolo (ej: BTCUSDT)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
            <input
              className="input-dark"
              placeholder="Nombre (ej: Bitcoin)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="number"
              className="input-dark"
              placeholder="Cantidad"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <input
              type="number"
              className="input-dark"
              placeholder="Precio promedio $"
              value={form.avgPrice}
              onChange={(e) => setForm({ ...form, avgPrice: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="btn-primary flex-1"
            >
              {adding ? "Guardando..." : "Agregar"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-white/20 rounded-xl p-3 text-slate-400 hover:text-white hover:border-white/40 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Agregar activo
        </button>
      )}
    </div>
  );
}
