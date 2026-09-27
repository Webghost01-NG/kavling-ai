from kavling.climate_risk import evaluate_climate_and_seismic_risk

def test_climate_risk_high_elevation():
    # Upland Ubud property with Grade A construction
    res = evaluate_climate_and_seismic_risk("Bali", elevation_masl=200.0, distance_to_coast_km=25.0, structural_audit_grade="A")
    assert res["flood_risk_score"] == 0.05
    assert res["resilience_score"] > 85.0
    assert res["valuation_risk_factor"] >= 1.0

def test_climate_risk_lowland_tidal():
    # Lowland coastal property with Grade C masonry
    res = evaluate_climate_and_seismic_risk("Jakarta", elevation_masl=2.0, distance_to_coast_km=1.0, structural_audit_grade="C")
    assert res["flood_risk_score"] == 0.40
    assert res["structural_grade"] == "C"
    assert res["resilience_score"] < 65.0
    assert res["valuation_risk_factor"] < 1.0
