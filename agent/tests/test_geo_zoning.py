from kavling.geo_zoning import get_zoning_assessment, INDONESIA_REGIONAL_BASE_PRICES

def test_bali_canggu_zoning():
    assessment = get_zoning_assessment("Bali", "Canggu", "Pariwisata", "SHM")
    assert assessment["city"] == "Bali"
    assert assessment["district"] == "Canggu"
    assert assessment["base_land_m2_usd"] == 1200.0
    assert assessment["zoning_valuation_multiplier"] == 1.15
    assert assessment["zoning_yield_bonus_bps"] == 180
    assert assessment["title_discount"] == 1.00

def test_jakarta_scbd_zoning():
    assessment = get_zoning_assessment("Jakarta", "SCBD", "Komersial", "HGB")
    assert assessment["city"] == "Jakarta"
    assert assessment["district"] == "SCBD"
    assert assessment["base_land_m2_usd"] == 4500.0
    assert assessment["title_discount"] == 0.92

def test_unknown_city_fallback():
    assessment = get_zoning_assessment("Surabaya", "Gubeng", "Residensial", "Hak Pakai")
    assert assessment["base_land_m2_usd"] == 800.0
    assert assessment["title_discount"] == 0.85
