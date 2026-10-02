import os


# Test-only identity. Production runs must provide AGENT_PRIVATE_KEY explicitly.
os.environ.setdefault(
    "AGENT_PRIVATE_KEY",
    "0x00000000000000000000000000000000000000000000000000000000000a11ce",
)
os.environ.setdefault("REGISTRY_ADDRESS", "0x1234567890123456789012345678901234567890")
