"""
Kavling AI - Indonesian BMKG Seismic & Tropical Climate Risk Engine
Evaluates structural integrity, fault line proximity, and monsoon flood resilience.
"""
from typing import Dict, Any

BMKG_FAULT_ZONES = {
    "Bali": {
        "fault_name": "Sunda Megathrust Arc",
        "seismic_hazard_pga": 0.28, # Peak ground acceleration (g)
        "risk_penalty": 0.04
    },
    "Jakarta": {
        "fault_name": "Baribis Fault & Subsidence Zone",
        "seismic_hazard_pga": 0.22,
        "risk_penalty": 0.06 # Increased due to northern land subsidence
    },
    "Yogyakarta": {
        "fault_name": "Opak Strike-Slip Fault",
        "seismic_hazard_pga": 0.35, # Historic 2006 epicenter
        "risk_penalty": 0.05
    },
    "Bandung": {
        "fault_name": "Lembang Active Fault",
        "seismic_hazard_pga": 0.32,
        "risk_penalty": 0.05
    }
}

def evaluate_climate_and_seismic_risk(
    city: str,
    elevation_masl: float,
    distance_to_coast_km: float,
    structural_audit_grade: str # A, B, C
) -> Dict[str, Any]:
    """
    Computes climate risk score, seismic resilience score, and aggregate valuation factor.
    """
    fault_info = BMKG_FAULT_ZONES.get(city, {
        "fault_name": "Regional Inactive Fault",
        "seismic_hazard_pga": 0.15,
        "risk_penalty": 0.02
    })

    # Flood / Elevation risk: < 5m elevation near coast has tidal flood risk (banjir rob)
    flood_risk_score = 0.0
    if elevation_masl < 5.0 and distance_to_coast_km < 3.0:
        flood_risk_score = 0.40 # High tidal flood risk
    elif elevation_masl < 15.0:
        flood_risk_score = 0.20 # Moderate tropical catchment risk
    else:
        flood_risk_score = 0.05 # Low flood risk (upland / hillside)

    # Structural audit adjustment
    audit_multipliers = {
        "A": 1.02, # Certified earthquake-resistant reinforced concrete (SNI 1726:2019)
        "B": 0.98, # Standard reinforced concrete
        "C": 0.90, # Non-engineered masonry, higher vulnerability
    }
    audit_factor = audit_multipliers.get(structural_audit_grade, 0.95)

    # Aggregate resilience score (0 to 100)
    resilience_score = max(10.0, min(100.0, (1.0 - flood_risk_score - fault_info["risk_penalty"]) * 100 * audit_factor))

    # Net valuation adjustment factor (0.85 to 1.05)
    valuation_risk_factor = round(0.85 + (resilience_score / 100.0) * 0.20, 4)

    return {
        "city": city,
        "active_fault_zone": fault_info["fault_name"],
        "seismic_pga_g": fault_info["seismic_hazard_pga"],
        "flood_risk_score": flood_risk_score,
        "structural_grade": structural_audit_grade,
        "resilience_score": round(resilience_score, 1),
        "valuation_risk_factor": valuation_risk_factor
    }
