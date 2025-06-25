#!/usr/bin/env python3
"""
Test script for ComfyUI Auth System HMAC implementation
This script helps test HMAC signature generation and validation.
"""

import json
import hmac
import hashlib
import time
import os

def generate_hmac_signature(payload_data, secret_key):
    """
    Generate HMAC signature exactly like the AuthManager does
    """
    try:
        # Create message with pod ID, timestamp and user data
        message_data = {
            "pod_id": payload_data.get("podId", ""),
            "timestamp": int(time.time()),
            "username": payload_data.get("username", ""),
            "action": "authenticate"
        }
        
        message = json.dumps(message_data, sort_keys=True)
        signature = hmac.new(
            secret_key.encode(), 
            message.encode(), 
            hashlib.sha256
        ).hexdigest()
        
        return signature, message, message_data
        
    except Exception as e:
        print(f"Error generating HMAC signature: {e}")
        return None, None, None

def test_hmac_generation():
    """Test HMAC signature generation"""
    print("🔐 Testing HMAC Signature Generation")
    print("=" * 40)
    
    # Test data
    secret_key = "test-secret-key-12345"
    payload = {
        "podId": "pod-test-123",
        "username": "test@example.com",
        "password": "test-password"
    }
    
    print(f"Secret Key: {secret_key}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    # Generate signature
    signature, message, message_data = generate_hmac_signature(payload, secret_key)
    
    if signature:
        print("✅ HMAC Generation Successful")
        print(f"Message Data: {json.dumps(message_data, indent=2)}")
        print(f"Message String: {message}")
        print(f"HMAC Signature: {signature}")
        print()
        
        # Test validation (simulate server-side)
        print("🔍 Testing Signature Validation")
        print("-" * 30)
        
        # Recreate the same message
        expected_signature = hmac.new(
            secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = hmac.compare_digest(signature, expected_signature)
        print(f"Expected: {expected_signature}")
        print(f"Received: {signature}")
        print(f"Valid: {'✅ Yes' if is_valid else '❌ No'}")
        
    else:
        print("❌ HMAC Generation Failed")

def test_with_env_vars():
    """Test with actual environment variables"""
    print("\n🌍 Testing with Environment Variables")
    print("=" * 40)
    
    secret_key = os.getenv("WEBHOOK_SECRET_KEY")
    pod_id = os.getenv("POD_ID", "test-pod")
    
    if not secret_key:
        print("⚠️  WEBHOOK_SECRET_KEY not set in environment")
        print("   Set it with: export WEBHOOK_SECRET_KEY=your-secret-key")
        return
    
    payload = {
        "podId": pod_id,
        "username": "test@example.com",
        "password": "test-password"
    }
    
    print(f"Using POD_ID: {pod_id}")
    print(f"Using WEBHOOK_SECRET_KEY: {'*' * len(secret_key)}")
    print()
    
    signature, message, message_data = generate_hmac_signature(payload, secret_key)
    
    if signature:
        print("✅ Environment Test Successful")
        print(f"Signature: {signature}")
        print()
        print("Use this signature in X-Signature header for testing")
    else:
        print("❌ Environment Test Failed")

def main():
    """Main test function"""
    print("🧪 ComfyUI Auth System - HMAC Test Script")
    print("=" * 50)
    print("This script tests HMAC signature generation and validation")
    print("to ensure compatibility with your authentication server.")
    print()
    
    # Run basic test
    test_hmac_generation()
    
    # Test with environment variables
    test_with_env_vars()
    
    print("\n📋 Next Steps:")
    print("1. Copy the signature format to your server implementation")
    print("2. Use hmac.compare_digest() for secure signature comparison")
    print("3. Ensure message format matches exactly (sorted JSON keys)")
    print("4. Test with your actual secret key and pod ID")

if __name__ == "__main__":
    main()
