import React, { useState } from "react";
import { Coins, TrendingUp, ArrowDownToLine, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function YieldDashboard({ userHoldings, onClaimYield, t }) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  // Total claimable across holdings
  const totalClaimable = userHoldings.reduce((sum, h) => sum + (h.claimableYieldUSD || 0), 0);
  const totalHoldingsVal = userHoldings.reduce((sum, h) => sum + (h.amountFractions * h.pricePerFractionUSD), 0);

  const handleClaim = async () => {
    if (totalClaimable <= 0) return;
    setIsClaiming(true);
    setClaimedSuccess(false);

    await new Promise((res) => setTimeout(res, 1200));

    onClaimYield();
    setIsClaiming(false);
    setClaimedSuccess(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Coins className="w-3.5 h-3.5" />
          {t.yields.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t.yields.title}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          {t.yields.subtitle}
        </p>
      </div>

      {/* Yield Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 block">{t.yields.holdings} Value</span>
          <span className="text-2xl font-bold text-white">${totalHoldingsVal.toFixed(2)} USD</span>
          <span className="text-[11px] text-emerald-400 block">Across {userHoldings.length} Indonesian Parcels</span>
        </div>

        <div className="glass-panel-glow p-5 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-xs text-slate-400 block">{t.yields.claimable}</span>
          <span className="text-2xl font-bold text-emerald-400">${totalClaimable.toFixed(2)} USDT</span>
          <span className="text-[11px] text-slate-400 block">Real-time tenant rental stream</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block">BNB Chain Settlement</span>
            <span className="text-sm font-bold text-amber-300">opBNB Sub-Cent Gas</span>
          </div>
          <button
            onClick={handleClaim}
            disabled={totalClaimable <= 0 || isClaiming}
            className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
          >
            {isClaiming ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                {t.yields.claiming}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                {t.yields.claimBtn}
              </span>
            )}
          </button>
        </div>
      </div>

      {claimedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rental yield claimed and deposited into your connected wallet successfully!</span>
        </div>
      )}

      {/* Holdings Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono">Property Holdings & Accrued Yield</h3>
          <span className="text-xs text-slate-400 font-mono">Vault Standard: ERC-20 + SafeYield</span>
        </div>

        {userHoldings.length > 0 ? (
          <div className="divide-y divide-white/5">
            {userHoldings.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.propertyName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                      {item.tokenSymbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Vault: {item.vaultAddress}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Your Shares</span>
                    <span className="text-white font-bold">{item.amountFractions} Fractions</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Estimated APY</span>
                    <span className="text-amber-400 font-bold">{item.annualYieldPercent}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Unclaimed Yield</span>
                    <span className="text-emerald-400 font-bold">${item.claimableYieldUSD.toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 font-mono space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p>{t.yields.emptyHoldings}</p>
          </div>
        )}
      </div>
    </div>
  );
}
