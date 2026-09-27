import React, { useState } from "react";
import { MapPin, ShieldCheck, TrendingUp, Coins, FileText, CheckCircle2, ChevronRight, X, Zap } from "lucide-react";

export default function PropertyMarketplace({ properties, t, onBuyFractions, wallet }) {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedPropForBuy, setSelectedPropForBuy] = useState(null);
  const [buyAmountFractions, setBuyAmountFractions] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("usdt"); // "usdt" or "bnb"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSuccessHash, setTxSuccessHash] = useState(null);

  const filteredProperties = properties.filter((p) => {
    if (selectedCity === "all") return true;
    return p.city.toLowerCase() === selectedCity.toLowerCase();
  });

  const bnbPrice = 600; // $600 USD per BNB

  const handleBuy = async (e) => {
    e.preventDefault();
    if (!selectedPropForBuy) return;
    setIsSubmitting(true);
    setTxSuccessHash(null);

    // Simulate / execute onchain purchase via vault
    await new Promise((res) => setTimeout(res, 1200));

    const mockHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    onBuyFractions(selectedPropForBuy.id, parseFloat(buyAmountFractions) || 1, mockHash, paymentMethod);

    setTxSuccessHash(mockHash);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.marketplace.badge}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.marketplace.title}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mt-1">
            {t.marketplace.subtitle}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {[
            { id: "all", label: t.marketplace.filterAll },
            { id: "bali", label: t.marketplace.filterBali },
            { id: "jakarta", label: t.marketplace.filterJakarta },
            { id: "yogyakarta", label: t.marketplace.filterJogja },
            { id: "bandung", label: t.marketplace.filterBandung },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCity(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCity === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProperties.map((prop) => {
          const fundedPercent = Math.min(
            100,
            Math.round(((prop.totalFractions - prop.availableFractions) / prop.totalFractions) * 100)
          );

          return (
            <div
              key={prop.id}
              className="glass-panel rounded-2xl border border-white/5 overflow-hidden bento-card flex flex-col justify-between"
            >
              {/* Image & Badges */}
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F111A] via-transparent to-black/30 pointer-events-none"></div>

                {/* City & Deed Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 border border-white/10">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {prop.city}, Indonesia
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md text-[11px] font-mono font-semibold text-emerald-300 border border-emerald-500/30">
                    {prop.legalDeed}
                  </span>
                </div>

                {/* Token Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md text-[11px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    {prop.tokenSymbol}
                  </span>
                </div>

                {/* Bottom title on image */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-white leading-snug drop-shadow-md">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                    {prop.address}
                  </p>
                </div>
              </div>

              {/* Stats Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {t.marketplace.valuation}
                    </span>
                    <span className="text-sm font-bold text-white">
                      ${(prop.valuationUSD / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="border-x border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {t.marketplace.fractionPrice}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      ${prop.pricePerFractionUSD}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {t.marketplace.estApy}
                    </span>
                    <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {prop.annualYieldPercent}%
                    </span>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.marketplace.funded}: <b className="text-white">{fundedPercent}%</b></span>
                    <span>
                      {prop.availableFractions.toLocaleString()} / {prop.totalFractions.toLocaleString()} Left
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${fundedPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {prop.description}
                </p>

                {/* Action Button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedPropForBuy(prop);
                      setTxSuccessHash(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    {t.marketplace.investBtn}
                  </button>

                  <a
                    href={`https://testnet.bscscan.com/address/${prop.vaultAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl glass-panel hover:bg-white/[0.08] text-slate-300 border border-white/5 text-xs font-mono"
                    title="View on BSCScan Testnet"
                  >
                    BSCScan
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buy Fractions Modal */}
      {selectedPropForBuy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-md w-full rounded-2xl p-6 relative border border-emerald-500/30">
            <button
              onClick={() => setSelectedPropForBuy(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Fractional Vault Purchase
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedPropForBuy.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Vault Token: {selectedPropForBuy.tokenSymbol}
                </p>
              </div>

              {!txSuccessHash ? (
                <form onSubmit={handleBuy} className="space-y-4 pt-2">
                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">Select Payment Currency</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("usdt")}
                        className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "usdt"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                            : "bg-black/30 border-white/5 text-slate-400"
                        }`}
                      >
                        <span>💵 USDT Stablecoin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bnb")}
                        className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "bnb"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                            : "bg-black/30 border-white/5 text-slate-400"
                        }`}
                      >
                        <span>🟡 Native tBNB</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium flex justify-between">
                      <span>Fractions to Buy (Min: 0.01)</span>
                      <span className="text-slate-400 font-mono">
                        Available: {selectedPropForBuy.availableFractions}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={selectedPropForBuy.availableFractions}
                        value={buyAmountFractions}
                        onChange={(e) => setBuyAmountFractions(e.target.value)}
                        className="w-full py-2.5 px-3.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">
                        {selectedPropForBuy.tokenSymbol}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {(() => {
                    const frac = parseFloat(buyAmountFractions) || 0;
                    const totalUSD = frac * selectedPropForBuy.pricePerFractionUSD;
                    const totalBNB = (totalUSD / bnbPrice).toFixed(4);

                    return (
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Price Per Fraction:</span>
                          <span className="text-white">${selectedPropForBuy.pricePerFractionUSD} USD</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total Payment Required:</span>
                          <span className={paymentMethod === "bnb" ? "text-amber-300 font-bold" : "text-emerald-400 font-bold"}>
                            {paymentMethod === "bnb" ? `${totalBNB} tBNB (~$${totalUSD.toFixed(2)})` : `$${totalUSD.toFixed(2)} USDT`}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                          <span>Estimated Monthly Rental:</span>
                          <span className="text-amber-400">
                            ~${((totalUSD * 0.10) / 12).toFixed(2)} / month
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        Confirming on BNB Chain...
                      </span>
                    ) : (
                      <span>Confirm & Deposit {paymentMethod === "bnb" ? "tBNB" : "USDT"}</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Purchase Confirmed!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      You now hold {buyAmountFractions} {selectedPropForBuy.tokenSymbol} fractional tokens. Rental yield streaming is now active for your wallet.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-slate-400 break-all border border-white/5">
                    Tx: {txSuccessHash}
                  </div>
                  <button
                    onClick={() => setSelectedPropForBuy(null)}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
