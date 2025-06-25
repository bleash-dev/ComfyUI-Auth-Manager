#!/usr/bin/env python3
"""
Example server-side HMAC validation for ComfyUI Auth System
This demonstrates how to validate HMAC signatures on your authentication endpoint.
"""

import json
import hmac
import hashlib
import time
from flask import Flask, request, jsonify

app = Flask(__name__)

# Your secret key - should match WEBHOOK_SECRET_KEY from ComfyUI environment
SECRET_KEY = "your-secret-key-here"

def validate_hmac_signature(payload, signature_header):
    """
    Validate HMAC signature from ComfyUI Auth System
    
    Args:
        payload (dict): The JSON payload from the request
        signature_header (str): The X-Signature header value
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        if not signature_header:
            print("No signature header provided")
            return False
        
        # Extract the actual signature (remove any prefix like 'sha256=')
        signature = signature_header.replace('sha256=', '')
        
        # Reconstruct the message that was signed
        message_data = {
            "pod_id": payload.get("podId", ""),
            "timestamp": int(time.time()),  # Note: In real implementation, use timestamp from request
            "username": payload.get("username", ""),
            "action": "authenticate"
        }
        
        # Create message string with sorted keys (same as client)
        message = json.dumps(message_data, sort_keys=True)
        
        # Generate expected signature
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures securely
        is_valid = hmac.compare_digest(signature, expected_signature)
        
        if is_valid:
            print(f"HMAC signature valid for pod {payload.get('podId')}")
        else:
            print(f"HMAC signature invalid for pod {payload.get('podId')}")
            print(f"Expected: {expected_signature}")
            print(f"Received: {signature}")
            print(f"Message: {message}")
        
        return is_valid
        
    except Exception as e:
        print(f"Error validating HMAC signature: {e}")
        return False

@app.route('/pods/authenticate', methods=['POST'])
def authenticate_pod():
    """
    Example authentication endpoint with HMAC validation
    """
    try:
        # Get request data
        payload = request.get_json()
        signature_header = request.headers.get('X-Signature')
        
        if not payload:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        # Validate required fields
        pod_id = payload.get('podId')
        username = payload.get('username')
        password = payload.get('password')
        
        if not all([pod_id, username, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate HMAC signature if secret key is configured
        if SECRET_KEY and SECRET_KEY != "your-secret-key-here":
            if not validate_hmac_signature(payload, signature_header):
                return jsonify({"error": "Invalid signature"}), 403
        else:
            print("Warning: HMAC validation skipped - no secret key configured")
        
        # Your authentication logic here
        # This is just an example - implement your actual auth logic
        if authenticate_user(username, password, pod_id):
            print(f"Authentication successful for user {username} on pod {pod_id}")
            return jsonify({
                "status": "success",
                "message": "Authentication successful",
                "pod_id": pod_id,
                "username": username
            }), 200
        else:
            print(f"Authentication failed for user {username} on pod {pod_id}")
            return jsonify({"error": "Invalid credentials"}), 401
            
    except Exception as e:
        print(f"Authentication error: {e}")
        return jsonify({"error": "Internal server error"}), 500

def authenticate_user(username, password, pod_id):
    """
    Your actual authentication logic goes here
    
    Args:
        username (str): The username/email
        password (str): The password
        pod_id (str): The pod identifier
    
    Returns:
        bool: True if authentication successful
    """
    # Example logic - replace with your actual authentication
    
    # Check if user exists and password is correct
    # This could involve database lookups, LDAP, etc.
    
    # Check if user has access to this specific pod
    # This could involve checking permissions, subscriptions, etc.
    
    # For demo purposes, accept any user with password "demo123"
    # and any pod ID that starts with "pod-"
    if password == "demo123" and pod_id.startswith("pod-"):
        return True
    
    return False

if __name__ == '__main__':
    print("ComfyUI Auth System - Example Server")
    print("=" * 40)
    print(f"Secret key configured: {'Yes' if SECRET_KEY != 'your-secret-key-here' else 'No'}")
    print("Endpoints:")
    print("  POST /pods/authenticate - Authentication endpoint")
    print()
    print("To test:")
    print("1. Set SECRET_KEY to match your WEBHOOK_SECRET_KEY")
    print("2. Implement your authentication logic in authenticate_user()")
    print("3. Run this server and point AUTH_ENDPOINT to it")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
