import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { calculatePropertyValuation, signAppraisalDigest } from "./ai-appraisal-engine.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const RPC_URL = process.env.BSC_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "0x3F91A8b628C8951b1424E608889d1C640982E7A2";
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const wallet = new ethers.Wallet(AGENT_PRIVATE_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL);

app.get("/health", async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({
      status: "ACTIVE",
      protocol: "Kavling AI Autonomous Appraisal Engine",
      agentSigner: wallet.address,
      targetNetwork: "BNB Smart Chain Testnet (Chain ID 97)",
      latestBscBlock: blockNumber,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      status: "DEGRADED",
      agentSigner: wallet.address,
      error: err.message
    });
  }
});

app.post("/api/appraise", async (req, res) => {
  try {
    const {
      name,
      city,
      district,
      landSizeM2,
      buildingSizeM2,
      bedrooms,
      bathrooms,
      yearBuilt,
      legalDeedType,
      amenities
    } = req.body;

    const analysis = calculatePropertyValuation({
      cityKey: city || "bali",
      landAreaSqm: Number(landSizeM2) || 400,
      buildingAreaSqm: Number(buildingSizeM2) || 250,
      bedrooms: Number(bedrooms) || 3,
      bathrooms: Number(bathrooms) || 2,
      yearBuilt: Number(yearBuilt) || 2024,
      titleType: legalDeedType || "SHM",
      amenitiesScore: 1.0 + ((amenities?.length || 2) * 0.04)
    });

    const propertyIdHex = ethers.id(`${name}-${city}-${legalDeedType}`);

    const signedPayload = await signAppraisalDigest({
      propertyIdHex,
      valuationUSD: analysis.valuationUSD,
      pricePerFractionUSD: analysis.pricePerFractionUSD,
      annualYieldBps: analysis.annualYieldBps,
      registryAddress: REGISTRY_ADDRESS,
      chainId: 97,
      signerPrivateKey: AGENT_PRIVATE_KEY
    });

    res.json({
      success: true,
      analysis: {
        propertyId: propertyIdHex,
        name,
        city,
        district,
        ...analysis,
        valuationIDR: analysis.valuationUSD * 16250
      },
      onchainPayload: {
        appraiserAddress: signedPayload.signerAddress,
        signature: signedPayload.signature,
        typedDataHash: ethers.TypedDataEncoder.hash(
          {
            name: "KavlingRegistry",
            version: "1.0.0",
            chainId: 97,
            verifyingContract: REGISTRY_ADDRESS
          },
          {
            Appraisal: [
              { name: "propertyId", type: "bytes32" },
              { name: "valuationUSD", type: "uint256" },
              { name: "pricePerFraction", type: "uint256" },
              { name: "annualYieldBps", type: "uint256" },
              { name: "timestamp", type: "uint256" },
              { name: "deadline", type: "uint256" }
            ]
          },
          {
            propertyId: propertyIdHex,
            valuationUSD: ethers.parseEther(analysis.valuationUSD.toString()),
            pricePerFraction: ethers.parseEther(analysis.pricePerFractionUSD.toString()),
            annualYieldBps: BigInt(analysis.annualYieldBps),
            timestamp: BigInt(signedPayload.timestamp),
            deadline: BigInt(signedPayload.deadline)
          }
        ),
        timestamp: signedPayload.timestamp,
        deadline: signedPayload.deadline
      }
    });
  } catch (err) {
    console.error("Appraisal error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Kavling AI Agent Service listening on port ${PORT}`);
  console.log(`Signer Address: ${wallet.address}`);
});
