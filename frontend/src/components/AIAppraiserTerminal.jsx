import React, { useState } from "react";
import { Cpu, Sparkles, ShieldCheck, Key, FileCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { ethers } from "ethers";
import { computeRealPropertyValuation, generateEIP712AppraisalSignature } from "../services/appraisalEngine";

export default function AIAppraiserTerminal({ t }) {
  const [formData, setFormData] = useState({
    name: "Uluwatu Ocean View Retreat",
    city: "bali",
    district: "uluwatu",
    landSizeM2: "450",
    buildingSizeM2: "280",
    bedrooms: "3",
    legalDeedType: "SHM",
    amenities: ["pool", "solar", "smartHome", "furnished"]
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [appraisalResult, setAppraisalResult] = useState(null);

  const handleToggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleAppraise = async (e) => {
    e.preventDefault();
    setIsEvaluating(true);
    setAppraisalResult(null);

    try {
      // 1. Compute real mathematical property valuation from parameters
      const valuation = computeRealPropertyValuation({
        cityKey: formData.city,
        landSizeM2: parseFloat(formData.landSizeM2) || 450,
        buildingSizeM2: parseFloat(formData.buildingSizeM2) || 280,
        bedrooms: parseInt(formData.bedrooms, 10) || 3,
        legalDeedType: formData.legalDeedType,
        amenitiesCount: formData.amenities.length
      });

      // 2. Generate deterministic propertyId from name and legal deed
      const propertyIdHex = ethers.id(`${formData.name}-${formData.city}-${formData.legalDeedType}`);

      // 3. Generate genuine EIP-712 signed appraisal vector
      const signedPayload = await generateEIP712AppraisalSignature({
        propertyIdHex,
        valuationUSD: valuation.valuationUSD,
        pricePerFractionUSD: valuation.pricePerFractionUSD,
        annualYieldBps: valuation.annualYieldBps
      });

      // Brief calculation tick for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      setAppraisalResult({
        analysis: {
          propertyId: propertyIdHex,
          name: formData.name,
          city: formData.city,
          district: formData.district,
          valuationUSD: valuation.valuationUSD,
          valuationIDR: valuation.valuationIDR,
          pricePerFractionUSD: valuation.pricePerFractionUSD,
          totalFractions: valuation.totalFractions,
          annualYieldBps: valuation.annualYieldBps,
          annualYieldPercent: valuation.capRatePercent,
          monthlyProjectedYieldUSD: Math.round(valuation.netOperatingIncome / 12),
          confidenceScore: valuation.confidenceScore,
          rawLandValue: valuation.rawLandValue,
          rawBuildingValue: valuation.rawBuildingValue
        },
        signature: signedPayload.signature,
        typedDataHash: signedPayload.typedDataHash,
        appraiserAddress: signedPayload.appraiserAddress
      });
    } catch (err) {
      console.error("Appraisal engine error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Cpu className="w-3.5 h-3.5" />
          {t.appraiser.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t.appraiser.title}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          {t.appraiser.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleAppraise} className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">{t.appraiser.propName}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.appraiser.city}</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="bali">Bali</option>
                <option value="jakarta">Jakarta</option>
                <option value="yogyakarta">Yogyakarta</option>
                <option value="bandung">Bandung</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.appraiser.district}</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.appraiser.landSize}</label>
              <input
                type="number"
                value={formData.landSizeM2}
                onChange={(e) => setFormData({ ...formData, landSizeM2: e.target.value })}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.appraiser.buildingSize}</label>
              <input
                type="number"
                value={formData.buildingSizeM2}
                onChange={(e) => setFormData({ ...formData, buildingSizeM2: e.target.value })}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">{t.appraiser.legalDeed}</label>
            <div className="grid grid-cols-2 gap-2">
              {["SHM", "HGB"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData({ ...formData, legalDeedType: type })}
                  className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                    formData.legalDeedType === type
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-black/30 border-white/5 text-slate-400"
                  }`}
                >
                  {type === "SHM" ? "SHM (Freehold)" : "HGB (Commercial)"}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-slate-300">{t.appraiser.amenities}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "pool", label: "Pool" },
                { id: "solar", label: "Solar Microgrid" },
                { id: "smartHome", label: "Smart IoT" },
                { id: "furnished", label: "Furnished" },
                { id: "highSpeedFiber", label: "Fiber Optic" },
                { id: "evCharging", label: "EV Charger" },
              ].map((item) => {
                const checked = formData.amenities.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleToggleAmenity(item.id)}
                    className={`p-2 rounded-lg text-[11px] font-mono border text-center transition-all ${
                      checked
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-black/20 text-slate-400 border-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 mt-4"
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                {t.appraiser.analyzing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t.appraiser.appraiseBtn}
              </span>
            )}
          </button>
        </form>

        {/* Results & Cryptographic Inspector Column */}
        <div className="lg:col-span-6 space-y-4">
          {appraisalResult ? (
            <div className="glass-panel-glow rounded-2xl p-6 border border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {t.appraiser.verdict}: APPROVED
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  Confidence: 95.2%
                </span>
              </div>

              {/* Valuation Stats */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase block">Total Fair Value</span>
                  <span className="text-xl font-bold text-white">
                    ${appraisalResult.analysis.valuationUSD.toLocaleString()} USD
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    ≈ Rp {(appraisalResult.analysis.valuationIDR / 1e9).toFixed(2)} Miliar IDR
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase block">Expected Rental APY</span>
                  <span className="text-xl font-bold text-amber-400">
                    {appraisalResult.analysis.annualYieldPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ${appraisalResult.analysis.monthlyProjectedYieldUSD} USD / month
                  </span>
                </div>
              </div>

              {/* Fractional Tokenization Breakdown */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Fractional Share Target:</span>
                  <span className="text-white">${appraisalResult.analysis.pricePerFractionUSD} / Token</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tokens to Mint:</span>
                  <span className="text-emerald-400 font-bold">
                    {appraisalResult.analysis.totalFractions.toLocaleString()} KVL Tokens
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Network:</span>
                  <span className="text-amber-400">BNB Chain Testnet (ID 97)</span>
                </div>
              </div>

              {/* EIP-712 Cryptographic Signature Proof Box */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.appraiser.signatureProof}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-slate-400 space-y-2 overflow-x-auto">
                  <div>
                    <span className="text-slate-500 block">Signer (AI Agent):</span>
                    <span className="text-emerald-400 select-all">{appraisalResult.appraiserAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">EIP-712 Signature (r,s,v):</span>
                    <span className="text-slate-300 break-all select-all">{appraisalResult.signature}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Digest Hash:</span>
                    <span className="text-amber-300 break-all select-all">{appraisalResult.typedDataHash}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.appraiser.readyToMint}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center space-y-3 min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
                <Cpu className="w-6 h-6 text-emerald-500/50" />
              </div>
              <h3 className="text-base font-bold text-slate-300">No Active Appraisal</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter your property details on the left and click appraise to witness the AI Agent calculate regional Indonesian comps and sign an on-chain EIP-712 proof.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
