#!/usr/bin/env python3
"""
Installation script for ComfyUI Authentication System
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required Python packages"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    try:
        print("📦 Installing required packages...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "-r", str(requirements_file)
        ])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ["AUTH_ENDPOINT", "POD_ID"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Warning: Required environment variables not set:")
        for var in missing_vars:
            print(f"   - {var}")
        print()
        print("📝 Please set these environment variables before using the auth system.")
        print("   See .env.example for reference.")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def main():
    """Main installation function"""
    print("🔐 ComfyUI Authentication System - Installation")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    print()
    
    # Check environment
    env_ok = check_environment()
    
    print()
    print("🎉 Installation completed!")
    
    if not env_ok:
        print("⚠️  Remember to configure environment variables before use")
    
    print()
    print("📖 Next steps:")
    print("   1. Set AUTH_ENDPOINT and POD_ID environment variables")
    print("   2. Restart ComfyUI")
    print("   3. The authentication modal will appear on startup")

if __name__ == "__main__":
    main()
