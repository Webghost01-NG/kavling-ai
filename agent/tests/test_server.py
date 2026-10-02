from fastapi.testclient import TestClient
from eth_account import Account
import kavling.server as server
from kavling.config import settings

app = server.app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert data["protocol"] == "Kavling AI"
    assert "appraiser_agent_address" in data

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["chainId"] == 97
    assert data["signerConfigured"] is True

def test_health_remains_healthy_without_signer(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PRIVATE_KEY", "")
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["signerConfigured"] is False

def test_info_does_not_require_signer(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PRIVATE_KEY", "")
    response = client.get("/api/info")
    assert response.status_code == 200
    assert response.json()["appraiser_agent_address"] is None
    assert response.json()["signer_configured"] is False

def test_health_and_info_survive_invalid_signer(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PRIVATE_KEY", "invalid")
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/info")
    assert response.status_code == 200
    assert response.json()["appraiser_agent_address"] is None

def test_list_properties():
    response = client.get("/api/properties")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 3
    assert len(data["properties"]) >= 3

def test_appraise_endpoint(monkeypatch):
    payload = {
        "property_id": "0x4b41564c494e472d42414c492d30310000000000000000000000000000000000",
        "city": "Bali",
        "district": "Canggu",
        "land_area_m2": 500,
        "building_area_m2": 350,
        "building_age_years": 2,
        "building_quality": "Luxury",
        "zoning": "Pariwisata",
        "title": "SHM",
        "total_fractions": 15000,
        "nonce": 1,
        "verifying_contract": "0x1234567890123456789012345678901234567890"
    }
    install_ready_registry(monkeypatch, nonce=0)
    response = client.post("/api/appraise", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "appraisal" in data
    assert "eip712_proof" in data
    assert data["eip712_proof"]["signature"].startswith("0x")

def test_appraise_uses_registry_nonce_not_client_nonce(monkeypatch):
    property_id = "0x" + "ab" * 32
    payload = {
        "property_id": property_id,
        "city": "Bali",
        "district": "Canggu",
        "land_area_m2": 500,
        "building_area_m2": 350,
        "nonce": 999999999,
    }

    install_ready_registry(monkeypatch, nonce=4)
    first = client.post("/api/appraise", json=payload)
    second = client.post("/api/appraise", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["eip712_proof"]["nonce"] == 5
    assert second.json()["eip712_proof"]["nonce"] == 5

def install_ready_registry(monkeypatch, nonce):
    key = settings.AGENT_PRIVATE_KEY
    authorized = Account.from_key(key).address

    class Call:
        def __init__(self, value):
            self.value = value

        def call(self):
            return self.value

    class Functions:
        def aiAppraiserAgent(self):
            return Call(authorized)

        def propertyNonces(self, _property_id):
            return Call(nonce)

    class Registry:
        functions = Functions()

    registry = Registry()
    details = {
        "status": "ready",
        "signerAddress": authorized,
        "authorizedAppraiser": authorized,
        "signerMatchesAuthorized": True,
    }
    monkeypatch.setattr(server, "_inspect_registry", lambda: (details, (None, registry)))

def test_appraise_rejects_unconfigured_chain():
    response = client.post("/api/appraise", json={"chain_id": 56})
    assert response.status_code == 400

def test_appraise_fails_closed_without_signer(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PRIVATE_KEY", "")
    response = client.post("/api/appraise", json={})
    assert response.status_code == 503

def test_appraise_fails_closed_on_authorized_signer_mismatch(monkeypatch):
    monkeypatch.setattr(
        server,
        "_inspect_registry",
        lambda: ({"status": "signer_mismatch"}, None),
    )
    response = client.post("/api/appraise", json={})
    assert response.status_code == 503
    assert "signer_mismatch" in response.json()["detail"]

def test_appraise_rejects_unconfigured_registry():
    response = client.post(
        "/api/appraise",
        json={"verifying_contract": "0x0000000000000000000000000000000000000001"},
    )
    assert response.status_code == 400

def test_telemetry_endpoint():
    response = client.get("/api/oracle/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert "securityAudits" in data
    assert data["appraiserAgent"] is not None

def test_deployment_reports_signer_readiness(monkeypatch):
    install_ready_registry(monkeypatch, nonce=0)
    response = client.get("/api/deployment")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["signerMatchesAuthorized"] is True

def test_compliance_verify():
    payload = {
        "investor_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "country_code": "ID",
        "national_id_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    response = client.post("/api/compliance/verify", json=payload)
    assert response.status_code == 200
    assert response.json()["verified"] is False
    assert response.json()["status"] == "address_format_only"
