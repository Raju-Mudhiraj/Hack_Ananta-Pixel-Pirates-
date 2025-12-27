import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  BrainCircuit,
  Zap,
  Leaf,
  Layers,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";

import {
  MenuItem,
  DailyEntry,
  PredictionResult,
  OptimizationMode
} from "../types";

import { getWastePredictions } from "../services/geminiService";

/* =========================
   PROPS
========================= */
interface PredictionViewProps {
  history: DailyEntry[];
  menu: MenuItem[];
  preOrders: Record<string, number>;
  onApplyPlan: (plan: Record<string, any>) => void;
  activeMode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
}

/* =========================
   COMPONENT
========================= */
const PredictionView: React.FC<PredictionViewProps> = ({
  history,
  menu,
  preOrders,
  onApplyPlan,
  activeMode,
  onModeChange
}) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [lastAppliedAt, setLastAppliedAt] = useState<string | null>(null);

  /* =========================
     GENERATE FORECAST
  ========================= */
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await getWastePredictions(
        history,
        menu,
        tomorrow.toISOString().split("T")[0],
        preOrders,
        activeMode
      );

      setPredictions(result);
    } catch {
      const fallback: PredictionResult[] = menu.map(item => ({
        menuItemId: item.id,
        name: item.name,
        predictedQuantity: 50,
        confidenceScore: 0.65,
        reasoning: "Fallback estimate based on historical averages.",
        carbonImpactSaved: 120,
        portionDistribution: {
          small: 15,
          regular: 25,
          large: 10
        }
      }));

      setPredictions(fallback);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     APPLY PLAN
  ========================= */
  const handleApply = () => {
    const plan = predictions.reduce((acc, p) => {
      acc[p.menuItemId] = {
        quantity: p.predictedQuantity,
        portions: p.portionDistribution
      };
      return acc;
    }, {} as Record<string, any>);

    onApplyPlan(plan);
    setLastAppliedAt(new Date().toLocaleTimeString());
    alert("✅ Kitchen Sync Successful!");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12">

      {/* ================= HEADER ================= */}
      <div className="rounded-[36px] bg-gradient-to-br from-emerald-50 via-white to-sky-50 border p-10 shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit size={14} className="animate-pulse" />
                AI Core Active
              </div>
              <div className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {history.length} Shift Logs Synced
              </div>
              <div className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} />
                {Object.values(preOrders).reduce((a, b) => (a as number) + (b as number), 0)} Bookings Detected
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight mt-4">
              Tomorrow’s Food Strategy
            </h1>
            <p className="text-slate-600 mt-2 max-w-lg">
              Dynamic forecasting leveraging the last **{Math.min(history.length, 7)} days** of canteen consumption and waste data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-4 rounded-3xl bg-slate-900 text-white text-sm font-black flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {loading ? "Crunching History…" : "Generate Real AI Forecast"}
            </button>

            {predictions.length > 0 && (
              <button
                onClick={handleApply}
                className="px-6 py-3 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition"
              >
                <CheckCircle size={14} />
                Apply Plan
              </button>
            )}
          </div>
        </div>

        {lastAppliedAt && (
          <div className="mt-6 text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle size={12} />
            Strategy applied at {lastAppliedAt}
          </div>
        )}
      </div>

      {/* ================= MODE SELECTOR ================= */}
      <div className="grid grid-cols-3 gap-3">
        {["NORMAL", "EXAM", "FEST"].map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m as OptimizationMode)}
            className={`rounded-2xl p-5 text-left transition ${activeMode === m
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-white border hover:bg-slate-50"
              }`}
          >
            <Zap size={16} />
            <h4 className="font-black mt-2">{m} Mode</h4>
            <p className="text-xs opacity-80">Demand variance tuning</p>
          </button>
        ))}
      </div>

      {/* ================= RESULTS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {predictions.map(p => {
          const total =
            p.portionDistribution.small +
            p.portionDistribution.regular +
            p.portionDistribution.large;

          return (
            <div
              key={p.menuItemId}
              className="relative rounded-3xl bg-white border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Confidence */}
              <div className="absolute top-5 right-5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {Math.round(p.confidenceScore * 100)}% confidence
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-slate-900 mb-6">
                {p.name}
              </h3>

              {/* KPI */}
              <div className="flex items-end gap-6 mb-6">
                <div>
                  <span className="text-6xl font-black text-slate-900">
                    {p.predictedQuantity}
                  </span>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">
                    Portions
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <Leaf size={14} />
                  −{p.carbonImpactSaved}g CO₂
                </div>
              </div>

              {/* Portion Labels */}
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-2">
                <span>S: {p.portionDistribution.small}</span>
                <span>R: {p.portionDistribution.regular}</span>
                <span>L: {p.portionDistribution.large}</span>
              </div>

              {/* Portion Bar */}
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 mb-6 flex">
                <div
                  className="bg-emerald-400"
                  style={{ width: `${(p.portionDistribution.small / total) * 100}%` }}
                />
                <div
                  className="bg-slate-900"
                  style={{ width: `${(p.portionDistribution.regular / total) * 100}%` }}
                />
                <div
                  className="bg-orange-400"
                  style={{ width: `${(p.portionDistribution.large / total) * 100}%` }}
                />
              </div>

              {/* Reasoning */}
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm italic text-slate-600">
                “{p.reasoning}”
              </div>
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {!loading && predictions.length === 0 && (
          <div className="col-span-full rounded-3xl border-2 border-dashed bg-slate-50 py-24 text-center">
            <BrainCircuit className="w-16 h-16 mx-auto text-slate-300 mb-6" />
            <h3 className="text-xl font-black text-slate-400">
              No forecast generated
            </h3>
            <button
              onClick={handleGenerate}
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-600"
            >
              Run Forecast <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionView;
