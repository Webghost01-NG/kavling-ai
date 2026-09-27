import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PropertyMarketplace from "./components/PropertyMarketplace";
import AIAppraiserTerminal from "./components/AIAppraiserTerminal";
import YieldDashboard from "./components/YieldDashboard";
import JudgeSimulator from "./components/JudgeSimulator";
import ArchitectureDocs from "./components/ArchitectureDocs";
import WalletModal from "./components/WalletModal";

import { translations } from "./data/translations";
import { INITIAL_PROPERTIES } from "./data/mockData";

export default function App() {
  const [lang, setLang] = useState("en"); // "en" or "id"
  const [activeTab, setActiveTab] = useState("marketplace");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const [properties, setProperties] = useState(INITIAL_PROPERTIES);

  const [wallet, setWallet] = useState({
    connected: true,
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    usdtBalance: 2500,
    tBnbBalance: 1.45,
    provider: "Demo Testnet Wallet"
  });

  // User holdings in real-time
  const [userHoldings, setUserHoldings] = useState([
    {
      propertyId: "prop-bali-canggu",
      propertyName: "Villa Canggu Eco-Sanctuary",
      tokenSymbol: "KVL-BALI",
      vaultAddress: "0x892a48B698C39F47738F31E83a7c64a38755694a",
      amountFractions: 2.5,
      pricePerFractionUSD: 50,
      annualYieldPercent: "10.40",
      claimableYieldUSD: 8.65
    }
  ]);

  const t = translations[lang];

  // Handler when user buys fractions
  const handleBuyFractions = (propertyId, amountFractions, txHash, paymentMethod = "usdt") => {
    const targetProp = properties.find((p) => p.id === propertyId);
    if (!targetProp) return;

    const costUSD = amountFractions * targetProp.pricePerFractionUSD;
    const bnbPrice = 600;

    // Deduct available
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, availableFractions: Math.max(0, p.availableFractions - amountFractions) }
          : p
      )
    );

    // Update or add holding
    setUserHoldings((prev) => {
      const existing = prev.find((h) => h.propertyId === propertyId);
      if (existing) {
        return prev.map((h) =>
          h.propertyId === propertyId
            ? { ...h, amountFractions: h.amountFractions + amountFractions }
            : h
        );
      }
      return [
        ...prev,
        {
          propertyId: targetProp.id,
          propertyName: targetProp.name,
          tokenSymbol: targetProp.tokenSymbol,
          vaultAddress: targetProp.vaultAddress,
          amountFractions: amountFractions,
          pricePerFractionUSD: targetProp.pricePerFractionUSD,
          annualYieldPercent: targetProp.annualYieldPercent,
          claimableYieldUSD: 2.15
        }
      ];
    });

    // Deduct wallet balance based on payment method
    setWallet((prev) => {
      if (paymentMethod === "bnb") {
        const costBNB = costUSD / bnbPrice;
        return {
          ...prev,
          tBnbBalance: Math.max(0, prev.tBnbBalance - costBNB)
        };
      } else {
        return {
          ...prev,
          usdtBalance: Math.max(0, prev.usdtBalance - costUSD)
        };
      }
    });
  };

  // Handler when user claims rental yield
  const handleClaimYield = () => {
    const totalClaimed = userHoldings.reduce((sum, h) => sum + (h.claimableYieldUSD || 0), 0);
    setUserHoldings((prev) => prev.map((h) => ({ ...h, claimableYieldUSD: 0 })));
    setWallet((prev) => ({
      ...prev,
      usdtBalance: prev.usdtBalance + totalClaimed
    }));
  };

  // Handler when Judge Simulator executes
  const handleSimulatorStepAction = () => {
    // Add extra simulation yield to show live responsiveness
    setUserHoldings((prev) =>
      prev.map((h) => ({ ...h, claimableYieldUSD: h.claimableYieldUSD + 5.42 }))
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navigation */}
      <Navbar
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        openWalletModal={() => setIsWalletModalOpen(true)}
        t={t}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero is shown on marketplace tab */}
        {activeTab === "marketplace" && (
          <Hero t={t} setActiveTab={setActiveTab} />
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {activeTab === "marketplace" && (
            <PropertyMarketplace
              properties={properties}
              t={t}
              onBuyFractions={handleBuyFractions}
              wallet={wallet}
            />
          )}

          {activeTab === "appraiser" && (
            <AIAppraiserTerminal t={t} />
          )}

          {activeTab === "yields" && (
            <YieldDashboard
              userHoldings={userHoldings}
              onClaimYield={handleClaimYield}
              t={t}
            />
          )}

          {activeTab === "simulator" && (
            <JudgeSimulator
              t={t}
              onSimulateAction={handleSimulatorStepAction}
            />
          )}

          {activeTab === "docs" && (
            <ArchitectureDocs lang={lang} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-8 px-4 lg:px-8 mt-16 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">Kavling AI</span>
            <span>•</span>
            <span>Indonesia Web3 Hackathon 2026 Submission</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>BNB Chain</span>
            <span>•</span>
            <span>Binance Academy</span>
            <span>•</span>
            <span>Coinvestasi</span>
            <span>•</span>
            <span>Dev Web3 Jogja</span>
          </div>
        </div>
      </footer>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        setWallet={setWallet}
      />
    </div>
  );
}
