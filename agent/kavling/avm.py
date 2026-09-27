"""
Kavling AI - Institutional Automated Valuation Model (AVM)
Synthesizes hedonic regression, spatial planning, BMKG seismic risks, and Indonesian net operating income.
"""
import math
from typing import Dict, Any
from .geo_zoning import get_zoning_assessment
from .climate_risk import evaluate_climate_and_seismic_risk

BUILDING_QUALITY_COST_M2_USD = {
    "Luxury": 1200.0,    # High-end finishes, private pool, smart villa
    "Standard": 650.0,   # Modern concrete construction
    "Economy": 400.0,    # Basic commercial / homestay
}

def calculate_appraisal(
    property_id_hex: str,
    city: str,
    district: str,
    land_area_m2: float,
    building_area_m2: float,
    building_age_years: int,
    building_quality: str,
    zoning: str,
    title: str,
    elevation_masl: float = 12.0,
    distance_to_coast_km: float = 4.0,
    structural_audit_grade: str = "A",
    total_fractions: int = 10_000
) -> Dict[str, Any]:
    """
    Computes mathematical appraisal and returns on-chain parameters (18-decimal integers).
    """
    # 1. Spatial & Zoning Assessment
    zoning_info = get_zoning_assessment(city, district, zoning, title)
    base_land_m2 = zoning_info["base_land_m2_usd"]
    zone_mult = zoning_info["zoning_valuation_multiplier"]
    title_discount = zoning_info["title_discount"]

    # Large land parcels have modest bulk scale efficiency
    size_efficiency = 1.0 if land_area_m2 <= 500 else math.pow(land_area_m2 / 500.0, -0.05)
    effective_land_rate = base_land_m2 * zone_mult * title_discount * size_efficiency
    land_value_usd = land_area_m2 * effective_land_rate

    # 2. Structural Building Assessment
    unit_build_cost = BUILDING_QUALITY_COST_M2_USD.get(building_quality, 650.0)
    # Straight-line depreciation with 50-year structural life, max 60% depreciation
    depreciation = min(0.60, building_age_years * 0.02)
    effective_build_rate = unit_build_cost * (1.0 - depreciation)
    building_value_usd = building_area_m2 * effective_build_rate

    # 3. Climate & Seismic Risk Assessment
    risk_info = evaluate_climate_and_seismic_risk(
        city, elevation_masl, distance_to_coast_km, structural_audit_grade
    )
    risk_factor = risk_info["valuation_risk_factor"]

    # 4. Total Valuation
    raw_valuation = (land_value_usd + building_value_usd) * risk_factor
    # Round to nearest $1,000 for realistic appraisal precision
    valuation_usd = round(raw_valuation / 1000.0) * 1000.0

    # 5. Net Rental Yield Forecasting (Cap Rate)
    # Hospitality / commercial tourism earns between 8.5% and 13.5%
    base_cap_rate = 0.075 + (zoning_info["tourism_demand_index"] - 1.0) * 0.08
    # Add zoning bonus
    cap_rate_adjusted = base_cap_rate + (zoning_info["zoning_yield_bonus_bps"] / 10000.0)
    # Cap rate bounds: 5.5% to 14.5%
    cap_rate = max(0.055, min(0.145, cap_rate_adjusted))
    annual_yield_bps = int(round(cap_rate * 10000))

    # 6. Fractional Economics
    price_per_fraction_usd = valuation_usd / float(total_fractions)

    # 7. Convert to 18-decimal fixed-point wei for BNB Chain contracts
    valuation_wei = int(valuation_usd * 10**18)
    price_per_fraction_wei = int(price_per_fraction_usd * 10**18)

    return {
        "property_id": property_id_hex,
        "city": city,
        "district": district,
        "valuation_usd": valuation_usd,
        "price_per_fraction_usd": round(price_per_fraction_usd, 2),
        "annual_yield_bps": annual_yield_bps,
        "annual_yield_percent": round(annual_yield_bps / 100.0, 2),
        "total_fractions": total_fractions,
        "land_value_usd": round(land_value_usd, 2),
        "building_value_usd": round(building_value_usd, 2),
        "risk_assessment": risk_info,
        "zoning_assessment": zoning_info,
        # On-chain formatted fields
        "on_chain": {
            "valuationUSD": str(valuation_wei),
            "pricePerFraction": str(price_per_fraction_wei),
            "annualYieldBps": annual_yield_bps,
        }
    }
