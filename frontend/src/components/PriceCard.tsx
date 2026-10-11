import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Asset } from "../types";

interface Props {
  asset: Asset;
  onClick?: () => void;
  selected?: boolean;
}

const SENTIMENT_COLORS = {
  POSITIVE: "text-emerald-400 bg-emerald-400/10",
  NEGATIVE: "text-red-400 bg-red-400/10",
  NEUTRAL: "text-slate-400 bg-slate-400/10",
};

export function PriceCard({ asset, onClick, selected }: Props) {
  const up = asset.changePercent24h >= 0;
  const sentiment = asset.sentiment;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${
        selected
          ? "border-violet-500 bg-violet-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-white text-lg">{asset.symbol.replace("USDT", "")}</p>
          <p className="text-xs text-slate-400">/{asset.symbol.slice(-4)}</p>
        </div>
        {sentiment && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${SENTIMENT_COLORS[sentiment.label]}`}>
            {sentiment.label}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-white mb-1">
        ${asset.price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      <div className={`flex items-center gap-1 text-sm ${up ? "text-emerald-400" : "text-red-400"}`}>
        {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{up ? "+" : ""}{asset.changePercent24h?.toFixed(2)}%</span>
        <span className="text-slate-500 text-xs ml-1">24h</span>
      </div>

      {sentiment?.headline && (
        <p className="mt-2 text-xs text-slate-500 truncate" title={sentiment.headline}>
          📰 {sentiment.headline}
        </p>
      )}
    </div>
  );
}
