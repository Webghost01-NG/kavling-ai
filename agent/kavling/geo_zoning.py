"""
Kavling AI - Indonesian Geospatial Zoning & Land Administration Model
Implements spatial planning rules (RTRW/RDTR) and Agrarian Law (UUPA No. 5/1960).
"""
from typing import Dict, Any

INDONESIA_REGIONAL_BASE_PRICES = {
    "Bali": {
        "Canggu": {"base_land_m2_usd": 1200, "tourism_demand_index": 1.45},
        "Seminyak": {"base_land_m2_usd": 1500, "tourism_demand_index": 1.35},
        "Pererenan": {"base_land_m2_usd": 950, "tourism_demand_index": 1.30},
        "Ubud": {"base_land_m2_usd": 800, "tourism_demand_index": 1.25},
        "Uluwatu": {"base_land_m2_usd": 1100, "tourism_demand_index": 1.40},
        "Sanur": {"base_land_m2_usd": 850, "tourism_demand_index": 1.20},
    },
    "Jakarta": {
        "SCBD": {"base_land_m2_usd": 4500, "tourism_demand_index": 1.10},
        "Menteng": {"base_land_m2_usd": 4000, "tourism_demand_index": 1.05},
        "Senopati": {"base_land_m2_usd": 3500, "tourism_demand_index": 1.15},
        "PIK": {"base_land_m2_usd": 2800, "tourism_demand_index": 1.20},
        "Pondok Indah": {"base_land_m2_usd": 3000, "tourism_demand_index": 1.00},
    },
    "Yogyakarta": {
        "Malioboro": {"base_land_m2_usd": 1400, "tourism_demand_index": 1.30},
        "Sleman": {"base_land_m2_usd": 750, "tourism_demand_index": 1.15},
        "Kraton": {"base_land_m2_usd": 1100, "tourism_demand_index": 1.20},
        "Kaliurang": {"base_land_m2_usd": 550, "tourism_demand_index": 1.10},
    },
    "Bandung": {
        "Dago": {"base_land_m2_usd": 1100, "tourism_demand_index": 1.25},
        "Ciumbuleuit": {"base_land_m2_usd": 900, "tourism_demand_index": 1.15},
        "Riau": {"base_land_m2_usd": 1200, "tourism_demand_index": 1.10},
    }
}

ZONING_MULTIPLIERS = {
    "Pariwisata": {"valuation_mult": 1.15, "yield_bps_bonus": 180},   # Tourism zones generate higher hospitality yields
    "Komersial": {"valuation_mult": 1.10, "yield_bps_bonus": 120},    # High foot traffic, institutional tenants
    "Residensial": {"valuation_mult": 1.00, "yield_bps_bonus": 0},    # Baseline
    "Pertanian": {"valuation_mult": 0.70, "yield_bps_bonus": -200},   # Green zoning with building restrictions
}

LEGAL_TITLE_DISCOUNTS = {
    "SHM": 1.00,        # Sertifikat Hak Milik (Freehold) - Full sovereign title
    "HGB": 0.92,        # Hak Guna Bangunan (Commercial Lease 30-80 yrs)
    "Hak Pakai": 0.85,  # Right of Use
}

def get_zoning_assessment(city: str, district: str, zoning: str, title: str) -> Dict[str, Any]:
    city_data = INDONESIA_REGIONAL_BASE_PRICES.get(city)
    if not city_data:
        # Default SEA fallback
        base_price = 800.0
        tourism_idx = 1.0
    else:
        district_data = city_data.get(district, list(city_data.values())[0])
        base_price = float(district_data["base_land_m2_usd"])
        tourism_idx = float(district_data["tourism_demand_index"])

    zone_info = ZONING_MULTIPLIERS.get(zoning, ZONING_MULTIPLIERS["Residensial"])
    title_discount = LEGAL_TITLE_DISCOUNTS.get(title, 0.90)

    return {
        "city": city,
        "district": district,
        "base_land_m2_usd": base_price,
        "tourism_demand_index": tourism_idx,
        "zoning": zoning,
        "zoning_valuation_multiplier": zone_info["valuation_mult"],
        "zoning_yield_bonus_bps": zone_info["yield_bps_bonus"],
        "title": title,
        "title_discount": title_discount,
    }
