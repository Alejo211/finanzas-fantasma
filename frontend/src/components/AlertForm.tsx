import { useState } from "react";
import { Bell, BellOff, Trash2, Plus } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useStore } from "../store/useStore";
import type { AlertCondition } from "../types";

const LABELS: Record<AlertCondition, string> = {
  PRICE_ABOVE: "Precio sube sobre $",
  PRICE_BELOW: "Precio baja de $",
  CHANGE_PERCENT_UP: "Sube % 24h ≥",
  CHANGE_PERCENT_DOWN: "Baja % 24h ≥",
  SENTIMENT_POSITIVE: "Sentimiento positivo",
  SENTIMENT_NEGATIVE: "Sentimiento negativo",
};

export function AlertManager() {
  const { createAlert, toggleAlert, deleteAlert, getAlerts } = useApi();
  const alerts = useStore((s) => s.alerts);
  const setAlerts = useStore((s) => s.setAlerts);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ symbol: "BTCUSDT", condition: "PRICE_ABOVE" as AlertCondition, threshold: "" });
  const [saving, setSaving] = useState(false);

  const noThreshold = ["SENTIMENT_POSITIVE", "SENTIMENT_NEGATIVE"].includes(form.condition);

  const create = async () => {
    setSaving(true);
    try {
      await createAlert(form);
      setAlerts(await getAlerts());
      setShow(false);
      setForm({ symbol: "BTCUSDT", condition: "PRICE_ABOVE", threshold: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border ${a.active ? "border-white/10 bg-white/5" : "border-white/5 bg-white/2 opacity-40"}`}>
          <div>
            <p className="text-sm font-medium text-white">
              {a.symbol.replace("USDT", "")} — {LABELS[a.condition]}{a.threshold ? ` ${a.threshold}` : ""}
            </p>
            <p className="text-xs text-slate-500">
              {a.triggeredAt ? `Disparada ${new Date(a.triggeredAt).toLocaleString("es-EC")}` : "En espera"}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => toggleAlert(a.id, a.active).then(() => getAlerts()).then(setAlerts)} className="p-1.5 text-slate-400 hover:text-white">
              {a.active ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button onClick={() => deleteAlert(a.id).then(() => setAlerts(alerts.filter((x) => x.id !== a.id)))} className="p-1.5 text-slate-500 hover:text-red-400">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      {show ? (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-dark" placeholder="Símbolo" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
            <select className="input-dark" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as AlertCondition })}>
              {Object.entries(LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {!noThreshold && (
              <input type="number" className="input-dark col-span-2" placeholder="Umbral" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="btn-primary flex-1">{saving ? "..." : "Crear"}</button>
            <button onClick={() => setShow(false)} className="btn-ghost flex-1">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShow(true)} className="w-full border border-dashed border-white/20 rounded-xl p-3 text-slate-400 hover:text-white hover:border-white/40 transition-colors text-sm flex items-center justify-center gap-2">
          <Plus size={16} /> Nueva alerta
        </button>
      )}
    </div>
  );
}
