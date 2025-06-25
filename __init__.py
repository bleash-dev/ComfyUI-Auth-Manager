"""
ComfyUI Authentication System
Provides email/password authentication for pod access
"""
WEB_DIRECTORY = "./js"

# Initialize the authentication system
try:
    from .api import setup_routes
    setup_routes()
    print("ComfyUI Auth System: API routes initialized successfully")
except Exception as e:
    print(f"ComfyUI Auth System: Error initializing API routes: {e}")

# Required for ComfyUI node registration
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', "WEB_DIRECTORY"]
