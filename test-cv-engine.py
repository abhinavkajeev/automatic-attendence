import requests
import json

# Test the CV engine endpoints
CV_ENGINE_URL = "http://localhost:5001"

def test_cv_engine():
    print("🧪 Testing CV Engine Endpoints...")
    
    # Test 1: Check health
    print("\n1. Health Check:")
    try:
        response = requests.get(f"{CV_ENGINE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Check current enrollments
    print("\n2. Current Enrollments:")
    try:
        response = requests.get(f"{CV_ENGINE_URL}/debug-embeddings")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Enrolled Students: {data['student_ids']}")
        print(f"   Total Count: {data['encodings_count']}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Re-process all with force
    print("\n3. Re-process All Students (Force):")
    try:
        response = requests.post(f"{CV_ENGINE_URL}/re-process-all", 
                               json={"force": True})
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Message: {data['message']}")
        print(f"   Newly Enrolled: {data['newly_enrolled']}")
        print(f"   Final Count: {data['final_enrolled_count']}")
        print(f"   Students: {data['current_students']}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ CV Engine testing completed!")

if __name__ == "__main__":
    test_cv_engine()