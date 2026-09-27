import React, { useState } from "react";
import { Calculator, TrendingUp, DollarSign, Calendar, ArrowRight, Sparkles } from "lucide-react";

export default function YieldCalculatorWidget({ defaultApy = 10.2, t }) {
  const [investmentUSD, setInvestmentUSD] = useState(500);
  const [durationYears, setDurationYears] = useState(3);
  const [reinvestYield, setReinvestYield] = useState(true);

  const annualApy = defaultApy / 100;
  const annualCapitalAppreciation = 0.065; // 6.5% Indonesian real estate historical growth

  // Calculation
  let totalFutureValue = investmentUSD;
  let totalRentalEarnings = 0;

  for (let year = 1; year <= durationYears; year++) {
    const rentalThisYear = totalFutureValue * annualApy;
    totalRentalEarnings += rentalThisYear;
    
    if (reinvestYield) {
      totalFutureValue = (totalFutureValue + rentalThisYear) * (1 + annualCapitalAppreciation);
    } else {
      totalFutureValue = totalFutureValue * (1 + annualCapitalAppreciation);
    }
  }

  const netProfitUSD = Math.round(totalFutureValue - investmentUSD);
  const monthlyRentalPassiveUSD = Math.round((investmentUSD * annualApy) / 12);
  const monthlyRentalPassiveIDR = (monthlyRentalPassiveUSD * 16250).toLocaleString("id-ID");

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" />
            ROI & Cashflow Simulator
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Compound Wealth Calculator
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate fractional rental cashflows and asset appreciation on BNB Chain.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
          <button
            onClick={() => setReinvestYield(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              reinvestYield ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Auto-Compound
          </button>
          <button
            onClick={() => setReinvestYield(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !reinvestYield ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Cashout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Investment Amount Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Initial Investment</span>
              <span className="text-amber-400 font-mono text-base">${investmentUSD.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="5"
              max="10000"
              step="25"
              value={investmentUSD}
              onChange={(e) => setInvestmentUSD(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$5 (Min Ticket)</span>
              <span>$5,000</span>
              <span>$10,000</span>
            </div>
          </div>

          {/* Time Horizon Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Holding Period</span>
              <span className="text-white font-mono text-base">{durationYears} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={durationYears}
              onChange={(e) => setDurationYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Year</span>
              <span>5 Years</span>
              <span>10 Years</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Assumed Base Rental APY: <strong className="text-emerald-400">{defaultApy}%</strong>
            </div>
            <div className="text-xs text-slate-400">
              Avg. Land Appreciation: <strong className="text-blue-400">+6.5%/yr</strong>
            </div>
          </div>
        </div>

        {/* Results Card Column */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/30 space-y-1">
            <div className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
              Projected Portfolio Value
            </div>
            <div className="text-3xl font-black text-white mt-1">
              ${Math.round(totalFutureValue).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +${netProfitUSD.toLocaleString()} Total Gain
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Passive Monthly Cashflow
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              ${monthlyRentalPassiveUSD} <span className="text-xs text-slate-400 font-normal">/ mo</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              ≈ Rp {monthlyRentalPassiveIDR} / bln
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
