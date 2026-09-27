from kavling.avm import calculate_appraisal

def test_canggu_villa_appraisal():
    result = calculate_appraisal(
        property_id_hex="0x4b41564c494e472d42414c492d30310000000000000000000000000000000000",
        city="Bali",
        district="Canggu",
        land_area_m2=500.0,
        building_area_m2=350.0,
        building_age_years=2,
        building_quality="Luxury",
        zoning="Pariwisata",
        title="SHM",
        elevation_masl=18.0,
        distance_to_coast_km=1.2,
        structural_audit_grade="A",
        total_fractions=15_000
    )

    assert result["valuation_usd"] > 500_000
    assert result["price_per_fraction_usd"] > 30.0
    assert 700 <= result["annual_yield_bps"] <= 1400
    assert int(result["on_chain"]["valuationUSD"]) > 0
    assert int(result["on_chain"]["pricePerFraction"]) > 0
    assert result["total_fractions"] == 15_000

def test_yogyakarta_heritage_appraisal():
    result = calculate_appraisal(
        property_id_hex="0x4b41564c494e472d4a4f474a412d303300000000000000000000000000000000",
        city="Yogyakarta",
        district="Malioboro",
        land_area_m2=480.0,
        building_area_m2=520.0,
        building_age_years=5,
        building_quality="Standard",
        zoning="Pariwisata",
        title="SHM",
        total_fractions=9_000
    )

    assert result["valuation_usd"] > 300_000
    assert result["annual_yield_bps"] >= 800
