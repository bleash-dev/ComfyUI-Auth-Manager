import os
from datetime import datetime
from aiohttp import web
try:
    from server import PromptServer
except ImportError:
    # Fallback for different ComfyUI versions
    try:
        from comfy.server import PromptServer
    except ImportError:
        print("ComfyUI Auth System: Could not import PromptServer")
        PromptServer = None

from .nodes import auth_manager


def get_premium_status():
    """Check if this is a premium instance"""
    is_premium = os.environ.get('IS_PREMIUM', '').lower()
    return is_premium == 'true'


def get_premium_env_vars():
    """Get premium environment variables if user is premium"""
    if not get_premium_status():
        return None
    
    api_key = os.environ.get('COMFY_UI_COPILOT_API_KEY', '')
    rsa_key = os.environ.get('COMFY_UI_COPILOT_PUBLIC_RSA_KEY', '')
    
    return {
        'chatApiKey': api_key,
        'rsaPublicKey': rsa_key,
        'isPremium': True
    }


def setup_routes():
    """Setup API routes for authentication"""
    
    if PromptServer is None:
        print("ComfyUI Auth System: PromptServer not available, "
              "skipping route setup")
        return
    
    @PromptServer.instance.routes.post("/auth/authenticate")
    async def authenticate(request):
        """Authenticate user with username and password"""
        try:
            data = await request.json()
            username = data.get("username")
            password = data.get("password")
            
            if not username or not password:
                return web.json_response({
                    "success": False,
                    "message": "Username and password are required"
                }, status=400)
            
            success, message, user_data = await auth_manager.authenticate(
                username, password)
            
            response_data = {
                "success": success,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            
            # Include user data for frontend localStorage storage
            if success and user_data:
                response_data["user_data"] = user_data
                
                # Add premium configuration if applicable
                premium_config = get_premium_env_vars()
                if premium_config:
                    response_data["premium_config"] = premium_config
                    print(f"✅ Premium config provided for user: {username}")
                else:
                    response_data["premium_config"] = {"isPremium": False}
                    print(f"ℹ️ Non-premium user authenticated: {username}")
            
            return web.json_response(response_data)
            
        except Exception as e:
            return web.json_response({
                "success": False,
                "message": f"Authentication error: {str(e)}"
            }, status=500)

    @PromptServer.instance.routes.get("/auth/status")
    async def get_auth_status(request):
        """Get current authentication status - now frontend managed"""
        try:
            # Return indication that auth is frontend-managed
            return web.json_response({
                "authenticated": False,
                "frontend_managed": True,
                "message": "Authentication is managed by frontend localStorage",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return web.json_response({
                "authenticated": False,
                "frontend_managed": True,
                "error": str(e)
            }, status=500)

    @PromptServer.instance.routes.post("/auth/logout")
    async def logout(request):
        """Logout the current user - handled by frontend localStorage"""
        try:
            auth_manager.logout()
            return web.json_response({
                "success": True,
                "message": "Logout handled by frontend localStorage",
                "frontend_managed": True,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return web.json_response({
                "success": False,
                "message": f"Logout error: {str(e)}"
            }, status=500)

    @PromptServer.instance.routes.get("/auth/check")
    async def check_auth(request):
        """Check authentication - now frontend managed"""
        try:
            return web.json_response({
                "authenticated": False,
                "frontend_managed": True,
                "message": "Check localStorage for authentication state",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return web.json_response({
                "authenticated": False,
                "frontend_managed": True,
                "error": str(e)
            }, status=500)

    @PromptServer.instance.routes.get("/auth/premium_check")
    async def premium_check(request):
        """Check premium status and return current environment values"""
        try:
            is_premium = get_premium_status()
            
            response_data = {
                "isPremium": is_premium,
                "timestamp": datetime.now().isoformat()
            }
            
            if is_premium:
                premium_config = get_premium_env_vars()
                if premium_config:
                    response_data.update(premium_config)
            
            return web.json_response(response_data)
            
        except Exception as e:
            return web.json_response({
                "isPremium": False,
                "error": str(e)
            }, status=500)
