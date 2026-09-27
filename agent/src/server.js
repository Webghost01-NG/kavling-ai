const express = require("express");
const cors = require("cors");
const { KavlingAIEngine } = require("./appraiser");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Default demo private key for testnet
const DEMO_AI_KEY = process.env.AI_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "0x3F91A8b628C8951b1424E608889d1C640982E7A2";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "97", 10);
const RPC_URL = process.env.RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";

const engine = new KavlingAIEngine(DEMO_AI_KEY, REGISTRY_ADDRESS, CHAIN_ID, RPC_URL);

// Curated Showcase Assets in Indonesia
const CURATED_PROPERTIES = [
  {
    id: "prop-bali-canggu",
    name: "Villa Canggu Eco-Sanctuary",
    city: "Bali",
    district: "Canggu",
    address: "Jl. Nelayan No. 18, Canggu, Badung, Bali",
    type: "Luxury Residential / Holiday Villa",
    legalDeed: "SHM (Hak Milik No. 04821)",
    landSizeM2: 520,
    buildingSizeM2: 340,
    valuationUSD: 750000,
    valuationIDR: 12150000000,
    pricePerFractionUSD: 50,
    totalFractions: 15000,
    availableFractions: 4210,
    annualYieldPercent: "10.40",
    monthlyRentalPoolUSD: 6500,
    occupancyRate: "88%",
    status: "FUNDING_ACTIVE",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    description: "Architectural 4-bedroom sanctuary featuring volcanic stone, plunge pools, and solar micro-grid generating passive rental returns from digital nomads in Bali."
  },
  {
    id: "prop-jkt-scbd",
    name: "SCBD Horizon Executive Suites",
    city: "Jakarta",
    district: "SCBD",
    address: "Sudirman Central Business District Lot 11, South Jakarta",
    type: "Commercial Office / Co-working",
    legalDeed: "HGB Murni (Commercial No. 1109)",
    landSizeM2: 1200,
    buildingSizeM2: 850,
    valuationUSD: 1450000,
    valuationIDR: 23490000000,
    pricePerFractionUSD: 50,
    totalFractions: 29000,
    availableFractions: 9800,
    annualYieldPercent: "8.65",
    monthlyRentalPoolUSD: 10450,
    occupancyRate: "94%",
    status: "FUNDING_ACTIVE",
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
    description: "Grade-A corporate floor leased to high-growth tech startups in Indonesia's premier financial center with multi-year USD-denominated master leases."
  },
  {
    id: "prop-jogja-craft",
    name: "Yogyakarta Creative Heritage Lofts",
    city: "Yogyakarta",
    district: "Prawirotaman",
    address: "Jl. Prawirotaman II No. 42, Mergangsan, Yogyakarta",
    type: "Boutique Hospitality & Art Studio",
    legalDeed: "SHM (Hak Milik No. 00812)",
    landSizeM2: 680,
    buildingSizeM2: 420,
    valuationUSD: 420000,
    valuationIDR: 6804000000,
    pricePerFractionUSD: 25,
    totalFractions: 16800,
    availableFractions: 6150,
    annualYieldPercent: "11.20",
    monthlyRentalPoolUSD: 3920,
    occupancyRate: "82%",
    status: "FUNDING_ACTIVE",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    description: "Javanese heritage joglo restored into boutique creative suites near historical Malioboro, offering prime tourist and cultural retreat cash flows."
  },
  {
    id: "prop-bdg-dago",
    name: "Dago Highland Wellness Retreat",
    city: "Bandung",
    district: "Dago Atas",
    address: "Jl. Dago Pakar Permai VII, Cimenyan, Bandung",
    type: "Eco-Resort & Event Venue",
    legalDeed: "SHM (Hak Milik No. 01945)",
    landSizeM2: 890,
    buildingSizeM2: 460,
    valuationUSD: 580000,
    valuationIDR: 9396000000,
    pricePerFractionUSD: 50,
    totalFractions: 11600,
    availableFractions: 5400,
    annualYieldPercent: "9.50",
    monthlyRentalPoolUSD: 4590,
    occupancyRate: "79%",
    status: "FUNDING_ACTIVE",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    description: "Hillside panoramic retreat in cool Bandung hills with high weekend staycation demand from Jakarta urbanites."
  }
];

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "kavling-ai-agent",
    timestamp: new Date().toISOString()
  });
});

// Real-time AI Oracle & BNB Chain Telemetry
app.get("/api/oracle/telemetry", async (req, res) => {
  const chainData = await engine.getChainTelemetry();

  res.json({
    network: chainData.network,
    chainId: chainData.chainId,
    latestBlock: chainData.blockNumber,
    gasPriceGwei: chainData.gasPriceGwei,
    rpcConnected: chainData.isLive,
    aiAgentSigner: engine.wallet.address,
    verifyingContract: REGISTRY_ADDRESS,
    modelName: "Kavling-Valuator-v2.6-SEA",
    valuationMethodology: "Automated Valuation Model (AVM) + EIP-712 Attestation",
    confidenceInterval: "95.2%",
    regionalDatasetsActive: ["Bali (Badung)", "Jakarta (DKI)", "Yogyakarta (DIY)", "Bandung (Jabar)"],
    lastHeartbeat: new Date().toISOString(),
    totalPropertiesUnderAppraisal: CURATED_PROPERTIES.length
  });
});

// Curated properties list
app.get("/api/properties", (req, res) => {
  res.json({
    success: true,
    count: CURATED_PROPERTIES.length,
    properties: CURATED_PROPERTIES
  });
});

// Run AI Appraisal & EIP-712 Signing on user input
app.post("/api/appraise", async (req, res) => {
  try {
    const propertyParams = req.body;
    if (!propertyParams.name || !propertyParams.city) {
      return res.status(400).json({
        error: "Missing required fields: 'name' and 'city' are required"
      });
    }

    // 1. Evaluate with AI model
    const appraisalResult = engine.evaluateProperty(propertyParams);

    // 2. Sign with EIP-712
    const signedData = await engine.signAppraisal(appraisalResult);

    res.json({
      success: true,
      analysis: appraisalResult,
      onchainPayload: signedData
    });
  } catch (error) {
    console.error("Appraisal error:", error);
    res.status(500).json({
      error: "Failed to appraise property",
      details: error.message
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🤖 Kavling AI Appraisal Agent running on port ${PORT}`);
    console.log(`🔑 AI Signer Address: ${engine.wallet.address}`);
    console.log(`⛓️ Connected to BNB Chain (Chain ID ${CHAIN_ID})`);
  });
}

module.exports = app;
