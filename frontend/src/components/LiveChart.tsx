import { useEffect, useRef, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "../store/useStore";

interface DataPoint {
  time: string;
  price: number;
}

interface Props {
  symbol: string;
}

export function LiveChart({ symbol }: Props) {
  const asset = useStore((s) => s.assets[symbol]);
  const [history, setHistory] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!asset?.price) return;
    const point: DataPoint = {
      time: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      price: asset.price,
    };
    setHistory((prev) => [...prev.slice(-60), point]);
  }, [asset?.price]);

  if (!history.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        Esperando datos en tiempo real...
      </div>
    );
  }

  const up = history.length > 1 && history[history.length - 1].price >= history[0].price;

  return (
    <ResponsiveContainer width="100%" height={192}>
      <AreaChart data={history} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={up ? "#34d399" : "#f87171"} stopOpacity={0.3} />
            <stop offset="95%" stopColor={up ? "#34d399" : "#f87171"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "#64748b", fontSize: 10 }}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: up ? "#34d399" : "#f87171" }}
          formatter={(v: number) => [`$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Precio"]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={up ? "#34d399" : "#f87171"}
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={false}
          animationDuration={300}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
