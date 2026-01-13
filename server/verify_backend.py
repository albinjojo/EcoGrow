import requests
import time

BASE_URL = "http://localhost:5000/api"

def verify_backend():
    session = requests.Session()
    
    # 1. Signup/Login
    email = f"test_{int(time.time())}@example.com"
    password = "Password123!"
    
    print(f"Creating user {email}...")
    res = session.post(f"{BASE_URL}/signup", json={
        "email": email,
        "password": password,
        "confirmPassword": password
    })
    
    if res.status_code != 201:
        print(f"Signup failed: {res.text}")
        # Try login if already exists (unlikely with timestamp)
        res = session.post(f"{BASE_URL}/login", json={
            "email": email,
            "password": password
        })
        if res.status_code != 200:
            print("Login failed too.")
            return

    # Login to be sure (signup usually doesn't auto-login in this app? check app.py... 
    # Signup returns 201 but doesn't seem to set session in app.py logic shown earlier. 
    # Ah, I need to login to get the session cookie.)
    res = session.post(f"{BASE_URL}/login", json={
        "email": email,
        "password": password
    })
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    print("Logged in.")

    # 2. Get Profile (should be empty/default)
    res = session.get(f"{BASE_URL}/account/profile")
    if res.status_code != 200:
        print(f"Get profile failed: {res.text}")
        return
    profile = res.json().get("profile", {})
    print(f"Initial profile: {profile}")
    
    # 3. Update Profile
    new_profile = {
        "full_name": "Test User",
        "phone_number": "1234567890",
        "country": "Testland",
        "state_region": "TestRegion"
    }
    print("Updating profile...")
    res = session.post(f"{BASE_URL}/account/profile", json=new_profile)
    if res.status_code != 200:
        print(f"Update profile failed: {res.text}")
        return
    print("Update success.")

    # 4. Get Profile again
    res = session.get(f"{BASE_URL}/account/profile")
    profile = res.json().get("profile", {})
    print(f"Updated profile: {profile}")
    
    # Verify values
    if (profile.get("full_name") == "Test User" and 
        profile.get("country") == "Testland"):
        print("VERIFICATION SUCCESSFUL")
    else:
        print("VERIFICATION FAILED: Data mismatch")

if __name__ == "__main__":
    verify_backend()
