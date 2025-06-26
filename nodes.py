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
    Note: Authentication state is now managed by frontend localStorage
    """
    
    def __init__(self):
        # Auth endpoint from environment
        self.auth_endpoint = os.getenv("AUTH_ENDPOINT", "https://your-api.com")
        self.pod_id = os.getenv("RUNPOD_POD_ID", "unknown")
        
        print(f"Auth Manager: Using auth endpoint: {self.auth_endpoint}")
        print(f"Auth Manager: Pod ID: {self.pod_id}")
        print("Auth Manager: Authentication state managed by "
              "frontend localStorage")
        
        print("Auth Manager initialized")

    def _save_auth_status(self, authenticated=False, username=None):
        """
        Authentication status - now handled by frontend localStorage
        This method is kept for backward compatibility
        """
        auth_data = {
            "authenticated": authenticated,
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "pod_id": self.pod_id
        }
        
        print(f"Auth Manager: Authentication status - "
              f"authenticated: {authenticated}, "
              f"managed by frontend localStorage")
        return auth_data

    def _load_auth_status(self):
        """Authentication status is now managed by frontend localStorage"""
        # Return default state since auth is now frontend-managed
        return {
            "authenticated": False,
            "username": None,
            "message": "Authentication managed by frontend localStorage"
        }

    def is_authenticated(self):
        """Authentication check is now handled by frontend localStorage"""
        # Always return False since backend no longer manages auth state
        return False

    def get_auth_status(self):
        """Get current authentication status - frontend managed"""
        return {
            "authenticated": False,
            "username": None,
            "backend_managed": False,
            "frontend_managed": True,
            "message": "Authentication state managed by frontend localStorage"
        }

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
        Returns: (success: bool, message: str, user_data: dict)
        Note: Authentication state is now managed by frontend localStorage
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
                # Authentication successful - return data for frontend storage
                user_data = {
                    "username": username,
                    "pod_id": actual_pod_id,
                    "authenticated_at": datetime.now().isoformat(),
                    "session_id": f"{actual_pod_id}_{int(time.time())}"
                }
                
                print(f"Auth Manager: Authentication successful for "
                      f"user: {username}")
                return True, "Authentication successful", user_data
            elif response.status_code == 401:
                # Invalid credentials
                print(f"Auth Manager: Authentication failed - {response.text}")
                print(f"Auth Manager: Authentication failed - "
                      f"invalid credentials for user: {username}")
                return False, "Invalid username or password", None
            elif response.status_code == 403:
                # Access denied
                print(f"Auth Manager: Authentication failed - "
                      f"access denied for user: {username}")
                return False, "Access denied for this pod", None
            else:
                # Other error
                print(f"Auth Manager: Authentication failed - "
                      f"server error: {response.status_code}")
                return False, f"Server error: {response.status_code}", None
                
        except requests.exceptions.Timeout:
            print("Auth Manager: Authentication request timed out")
            return False, "Authentication request timed out", None
        except requests.exceptions.ConnectionError:
            print("Auth Manager: Could not connect to authentication server")
            return False, "Could not connect to authentication server", None
        except Exception as e:
            print(f"Auth Manager: Authentication error: {e}")
            return False, f"Authentication error: {str(e)}", None

    def logout(self):
        """Logout handled by frontend localStorage"""
        print("Auth Manager: Logout - handled by frontend localStorage")

    def clear_auth(self):
        """Clear authentication data - handled by frontend localStorage"""
        print("Auth Manager: Clear auth - handled by frontend localStorage")


# Global auth manager instance
auth_manager = AuthManager()
