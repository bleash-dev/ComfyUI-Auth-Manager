import os
import json
import time
import hmac
import hashlib
import requests
from datetime import datetime
from pathlib import Path


class AuthManager:
    """
    Manages authentication for ComfyUI pods
    """
    
    def __init__(self):
        # Get config root from environment or default to /root
        self.config_root = os.getenv("CONFIG_ROOT", "/root")
        self.auth_dir = Path(self.config_root) / ".comfyui_auth"
        self.auth_file = self.auth_dir / "auth_status"
        
        # Auth endpoint from environment
        self.auth_endpoint = os.getenv("AUTH_ENDPOINT", "https://your-api.com")
        self.pod_id = os.getenv("RUNPOD_POD_ID", "unknown")
        
        print(f"Auth Manager: Using config root: {self.config_root}")
        print(f"Auth Manager: Using auth endpoint: {self.auth_endpoint}")
        print(f"Auth Manager: Pod ID: {self.pod_id}")
        
        # Ensure directories exist
        try:
            self.auth_dir.mkdir(parents=True, exist_ok=True)
            print(f"Auth Manager: Created auth directory: {self.auth_dir}")
        except Exception as e:
            print(f"Auth Manager: Error creating auth directory: {e}")
        
        print("Auth Manager initialized")

    def _save_auth_status(self, authenticated=False, username=None):
        """Save authentication status to file"""
        auth_data = {
            "authenticated": authenticated,
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "pod_id": self.pod_id
        }
        
        try:
            with open(self.auth_file, 'w') as f:
                json.dump(auth_data, f)
            print(f"Auth Manager: Saved auth status - "
                  f"authenticated: {authenticated}")
        except Exception as e:
            print(f"Auth Manager: Error saving auth status: {e}")

    def _load_auth_status(self):
        """Load authentication status from file"""
        try:
            if self.auth_file.exists():
                with open(self.auth_file, 'r') as f:
                    data = json.load(f)
                    return data
            return {"authenticated": False, "username": None}
        except Exception as e:
            print(f"Auth Manager: Error loading auth status: {e}")
            return {"authenticated": False, "username": None}

    def is_authenticated(self):
        """Check if user is currently authenticated"""
        auth_data = self._load_auth_status()
        return auth_data.get("authenticated", False)

    def get_auth_status(self):
        """Get current authentication status data"""
        return self._load_auth_status()

    def _get_current_pod_id(self):
        """Get current RunPod ID using multiple fallback methods"""
        # Method 1: Check RunPod-specific environment variable
        runpod_pod_id = os.getenv("RUNPOD_POD_ID", "")
        if runpod_pod_id and runpod_pod_id != "unknown":
            print(f"Auth Manager: Found pod ID from RUNPOD_POD_ID environment variable: {runpod_pod_id}")
            return runpod_pod_id
        
        # Method 2: Check RunPod metadata file
        try:
            metadata_file = Path("/runpod-volume/runpod.json")
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    pod_id = metadata.get("podId")
                    if pod_id:
                        print(f"Auth Manager: Found pod ID from metadata file: {pod_id}")
                        return pod_id
        except Exception as e:
            print(f"Auth Manager: Error reading RunPod metadata file: {e}")
        
        print("Auth Manager: Could not determine pod ID, using existing value")
        return self.pod_id

    def _get_hmac_signature(self, payload_data):
        """Generate HMAC signature for secure API calls"""
        try:
            secret_key = os.getenv("WEBHOOK_SECRET_KEY", "")
            if not secret_key:
                print("Auth Manager: WEBHOOK_SECRET_KEY environment variable is not set")
                return None
            
            message = json.dumps(payload_data, separators=(",", ":"), ensure_ascii=False)
            signature = hmac.new(
                secret_key.encode(), 
                message.encode(), 
                hashlib.sha256
            ).hexdigest()
            
            print("Auth Manager: Generated HMAC signature for authentication")
            return signature
            
        except Exception as e:
            print(f"Auth Manager: Error generating HMAC signature: {e}")
            return None

    async def authenticate(self, username, password):
        """
        Authenticate user with the backend API with HMAC signature
        Returns: (success: bool, message: str)
        """
        try:
            auth_url = f"{self.auth_endpoint}"
            
            # Get the actual pod ID using the same method as idle-checker
            actual_pod_id = self._get_current_pod_id()
            
            payload = {
                "password": password,
                "runPodId": actual_pod_id,
                "username": username,

            }

            print("payload:", json.dumps(payload, indent=2))
            
            headers = {
                "Content-Type": "application/json"
            }
            
            # Add HMAC signature if available
            signature = self._get_hmac_signature(payload)
            if signature:
                headers["x-signature"] = signature
                print("Auth Manager: Added HMAC signature to request")
            else:
                print("Auth Manager: No HMAC signature - proceeding without")
            
            print(f"Auth Manager: Attempting authentication for "
                  f"user: {username} with pod ID: {actual_pod_id}")
            
            response = requests.post(
                auth_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Authentication successful
                self._save_auth_status(authenticated=True, username=username)
                print(f"Auth Manager: Authentication successful for "
                      f"user: {username}")
                return True, "Authentication successful"
            elif response.status_code == 401:
                # Invalid credentials
                print(f"Auth Manager: Authentication failed - {response.text}")
                self._save_auth_status(authenticated=False)
                print(f"Auth Manager: Authentication failed - "
                      f"invalid credentials for user: {username}")
                return False, "Invalid username or password"
            elif response.status_code == 403:
                # Access denied
                self._save_auth_status(authenticated=False)
                print(f"Auth Manager: Authentication failed - "
                      f"access denied for user: {username}")
                return False, "Access denied for this pod"
            else:
                # Other error
                self._save_auth_status(authenticated=False)
                print(f"Auth Manager: Authentication failed - "
                      f"server error: {response.status_code}")
                return False, f"Server error: {response.status_code}"
                
        except requests.exceptions.Timeout:
            print("Auth Manager: Authentication request timed out")
            return False, "Authentication request timed out"
        except requests.exceptions.ConnectionError:
            print("Auth Manager: Could not connect to authentication server")
            return False, "Could not connect to authentication server"
        except Exception as e:
            print(f"Auth Manager: Authentication error: {e}")
            return False, f"Authentication error: {str(e)}"

    def logout(self):
        """Logout the current user"""
        self._save_auth_status(authenticated=False)
        print("Auth Manager: User logged out")

    def clear_auth(self):
        """Clear all authentication data"""
        try:
            if self.auth_file.exists():
                self.auth_file.unlink()
                print("Auth Manager: Authentication data cleared")
        except Exception as e:
            print(f"Auth Manager: Error clearing auth data: {e}")


# Global auth manager instance
auth_manager = AuthManager()
