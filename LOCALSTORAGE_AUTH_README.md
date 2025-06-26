# ComfyUI Auth System - Frontend localStorage Implementation

This document describes the updated ComfyUI Auth System that now stores authentication state in the browser's localStorage instead of backend files.

## 🔄 Changes Made

### Backend Changes (`nodes.py`)
- Authentication state is no longer saved to files on the backend
- `authenticate()` method now returns user data for frontend storage
- Backend serves as validation-only service
- All auth state management moved to frontend

### Frontend Changes (`auth_modal.js`)
- Authentication state now stored in browser localStorage
- Auto-checks localStorage on page load
- Handles session expiry (24-hour default)
- Improved user experience with persistent sessions

### New Utilities (`auth_storage.js`)
- Dedicated localStorage management utilities
- Global access functions for authentication state
- Auto-refresh functionality
- Debug and status utilities

## 🚀 How It Works

### 1. Authentication Flow
```
User Login → Backend Validation → Frontend Storage → Hide Modal
```

### 2. Session Check Flow
```
Page Load → Check localStorage → Show/Hide Modal
```

### 3. Logout Flow
```
User Logout → Clear localStorage → Show Modal
```

## 📋 LocalStorage Data Structure

The authentication data is stored in localStorage with this structure:

```javascript
{
  "username": "user@example.com",
  "pod_id": "pod-12345",
  "session_id": "pod-12345_1703123456",
  "authenticated_at": "2024-12-20T10:30:00.000Z",
  "saved_at": "2024-12-20T10:30:00.000Z",
  "expires_at": "2024-12-21T10:30:00.000Z"
}
```

## 🔧 Configuration

### Storage Key
- Default: `comfyui_auth_data`
- Can be changed in `auth_modal.js`

### Session Expiry
- Default: 24 hours
- Configurable in `auth_storage.js`

### Auto-Refresh
- Refreshes session every 30 minutes if user is active
- Prevents unexpected logouts during long sessions

## 🛠️ Available Utilities

### Global Functions
```javascript
// Check authentication status
window.comfyAuthUtils.isAuthenticated()

// Get current user info
window.comfyAuthUtils.getCurrentUser()

// Get detailed status
window.comfyAuthUtils.getStatus()

// Manual logout
window.comfyAuthUtils.logout()

// Debug information
window.comfyAuthUtils.debug()

// Refresh session expiry
window.comfyAuthUtils.refresh()
```

### Storage Manager
```javascript
// Direct access to storage manager
window.comfyAuthStorage.saveAuth(userData)
window.comfyAuthStorage.getAuth()
window.comfyAuthStorage.clearAuth()
window.comfyAuthStorage.isAuthenticated()
```

## 🔍 Benefits

1. **No File System Dependencies**: No need for backend file permissions
2. **Better User Experience**: Sessions persist across browser sessions
3. **Client-Side Performance**: Faster authentication checks
4. **Automatic Cleanup**: Expired sessions are automatically removed
5. **Debug Friendly**: Easy to inspect and debug auth state

## 🚨 Security Considerations

1. **localStorage Persistence**: Data persists until manually cleared or expired
2. **Domain Isolation**: Auth data is isolated to the ComfyUI domain
3. **No Sensitive Data**: Only username and session info stored (no passwords)
4. **Automatic Expiry**: Sessions expire after 24 hours by default
5. **Validation**: Backend still validates all authentication requests

## 📱 Browser Compatibility

- Works in all modern browsers that support localStorage
- Gracefully falls back if localStorage is not available
- No external dependencies required

## 🔧 Environment Variables

Backend environment variables remain the same:
- `AUTH_ENDPOINT`: Authentication server URL
- `WEBHOOK_SECRET_KEY`: HMAC signature key
- `RUNPOD_POD_ID`: Pod identifier
- `CONFIG_ROOT`: Config directory (optional)

## 🐛 Debugging

### Check Authentication Status
```javascript
// In browser console
window.comfyAuthUtils.debug()
```

### Manual Operations
```javascript
// Force logout
window.comfyAuthUtils.logout()

// Check if authenticated
console.log('Authenticated:', window.comfyAuthUtils.isAuthenticated())

// Get user info
console.log('User:', window.comfyAuthUtils.getCurrentUser())
```

### Clear All Auth Data
```javascript
// Clear localStorage manually
localStorage.removeItem('comfyui_auth_data')
// Reload page to see login modal
location.reload()
```

## 🔄 Migration from File-Based Auth

The system automatically handles migration:
1. Old file-based auth is ignored
2. Users need to re-authenticate once
3. New localStorage system takes over
4. No data loss or corruption

## 📝 API Endpoints

The backend API endpoints remain functional but now return different responses:

- `POST /auth/authenticate`: Returns user data for localStorage storage
- `GET /auth/check`: Returns frontend-managed status message
- `GET /auth/status`: Returns frontend-managed status message
- `POST /auth/logout`: Acknowledges logout (localStorage handles actual logout)

## 🎯 Best Practices

1. **Regular Testing**: Test authentication in different browsers
2. **Monitor Expiry**: Watch for session expiry issues
3. **Debug Tools**: Use provided debug utilities for troubleshooting
4. **User Communication**: Clear messaging about session duration
5. **Backup Method**: Always have manual logout option available

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Use debug utilities to inspect auth state
3. Clear localStorage and try fresh authentication
4. Verify backend environment variables
5. Check network connectivity to auth endpoint
