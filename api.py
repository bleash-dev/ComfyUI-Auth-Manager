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
            
            success, message = await auth_manager.authenticate(
                username, password)
            
            return web.json_response({
                "success": success,
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            return web.json_response({
                "success": False,
                "message": f"Authentication error: {str(e)}"
            }, status=500)

    @PromptServer.instance.routes.get("/auth/status")
    async def get_auth_status(request):
        """Get current authentication status"""
        try:
            status_data = auth_manager.get_auth_status()
            return web.json_response(status_data)
        except Exception as e:
            return web.json_response({
                "authenticated": False,
                "error": str(e)
            }, status=500)

    @PromptServer.instance.routes.post("/auth/logout")
    async def logout(request):
        """Logout the current user"""
        try:
            auth_manager.logout()
            return web.json_response({
                "success": True,
                "message": "Logged out successfully",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return web.json_response({
                "success": False,
                "message": f"Logout error: {str(e)}"
            }, status=500)

    @PromptServer.instance.routes.get("/auth/check")
    async def check_auth(request):
        """Quick check if user is authenticated"""
        return web.json_response({
            "authenticated": auth_manager.is_authenticated()
        })
