const test = require("node:test");
const assert = require("node:assert");
const { ethers } = require("ethers");
const { KavlingAIEngine } = require("../src/appraiser");

test("KavlingAIEngine - evaluates property and generates accurate comps", () => {
  const dummyKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const registry = "0x1234567890123456789012345678901234567890";
  const engine = new KavlingAIEngine(dummyKey, registry, 97);

  const result = engine.evaluateProperty({
    name: "Uluwatu Sunset Cliff Villa",
    city: "bali",
    district: "uluwatu",
    buildingSizeM2: 300,
    landSizeM2: 500,
    bedrooms: 4,
    amenities: ["pool", "solar", "smartHome"],
    legalDeedType: "SHM"
  });

  assert.ok(result.propertyId);
  assert.ok(result.valuationUSD > 500000, "Valuation should be realistic");
  assert.ok(result.annualYieldBps >= 800 && result.annualYieldBps <= 1500, "Yield should be between 8% and 15%");
  assert.strictEqual(result.pricePerFractionUSD, 50);
  assert.ok(result.totalFractions > 1000);
});

test("KavlingAIEngine - generates valid EIP-712 cryptographic signature", async () => {
  const dummyKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const registry = "0x1234567890123456789012345678901234567890";
  const engine = new KavlingAIEngine(dummyKey, registry, 97);

  const propertyData = engine.evaluateProperty({
    name: "Jakarta Sudirman Tower",
    city: "jakarta",
    district: "scbd",
    buildingSizeM2: 400,
    landSizeM2: 600
  });

  const signedPayload = await engine.signAppraisal(propertyData);

  assert.strictEqual(signedPayload.appraiserAddress, engine.wallet.address);
  assert.ok(signedPayload.signature.startsWith("0x"));

  // Verify the signature recovers the agent's address
  const recoveredAddress = ethers.verifyTypedData(
    engine.domain,
    engine.types,
    {
      propertyId: signedPayload.appraisal.propertyId,
      valuationUSD: BigInt(signedPayload.appraisal.valuationUSD),
      pricePerFraction: BigInt(signedPayload.appraisal.pricePerFraction),
      annualYieldBps: BigInt(signedPayload.appraisal.annualYieldBps),
      timestamp: BigInt(signedPayload.appraisal.timestamp),
      deadline: BigInt(signedPayload.appraisal.deadline)
    },
    signedPayload.signature
  );

  assert.strictEqual(recoveredAddress.toLowerCase(), engine.wallet.address.toLowerCase());
});
