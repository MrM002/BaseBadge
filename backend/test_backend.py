"""
Quick test script to verify backend is running correctly
"""
import requests
import sys

def test_backend_health(base_url="http://127.0.0.1:8081"):
    """Test if backend is responding to basic requests"""
    print(f"Testing backend at {base_url}...")
    
    # Test 1: Stats endpoint
    try:
        response = requests.get(f"{base_url}/stats", timeout=5)
        print(f"✅ /stats endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Wallets analyzed: {data.get('wallets_analyzed', 0)}")
    except Exception as e:
        print(f"❌ /stats endpoint failed: {e}")
    
    # Test 2: Check on-chain reading endpoint
    test_address = "0x0000000000000000000000000000000000000000"
    try:
        response = requests.get(f"{base_url}/onchain/score", params={"address": test_address}, timeout=5)
        print(f"✅ /onchain/score endpoint: {response.status_code}")
        if response.status_code in [200, 404]:  # 404 is expected for empty address
            print(f"   Response: {response.json().get('error', 'Success')}")
    except Exception as e:
        print(f"❌ /onchain/score endpoint failed: {e}")
    
    # Test 3: Dashboard summary
    try:
        response = requests.get(f"{base_url}/dashboard/summary", params={"address": test_address}, timeout=5)
        print(f"✅ /dashboard/summary endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ /dashboard/summary endpoint failed: {e}")
    
    # Test 4: Badges endpoint
    try:
        response = requests.get(f"{base_url}/badges", params={"address": test_address}, timeout=5)
        print(f"✅ /badges endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Badges returned: {len(data.get('badges', []))}")
    except Exception as e:
        print(f"❌ /badges endpoint failed: {e}")

if __name__ == "__main__":
    test_backend_health()
