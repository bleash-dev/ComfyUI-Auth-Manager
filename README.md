# ComfyUI Authentication System

A custom node that provides email/password authentication for ComfyUI pods with a beautiful modal interface.

## Features

- 🔐 Secure email/password authentication
- 🎨 Beautiful gradient modal with loading indicators
- 🔄 Automatic authentication status checking
- 💾 Persistent authentication state
- 🛡️ Secure API communication with configurable endpoints
- 📱 Responsive design that works on all screen sizes

## Installation

1. Clone this repository into your ComfyUI custom_nodes directory:
```bash
cd ComfyUI/custom_nodes
git clone <repository-url> ComfyUI-Auth-System
```

2. Install the required dependencies:
```bash
cd ComfyUI-Auth-System
pip install -r requirements.txt
```

3. Restart ComfyUI

## Environment Variables

Configure the following environment variables:

### Required
- `AUTH_ENDPOINT`: The base URL of your authentication API (e.g., `https://your-api.com`)
- `POD_ID`: Unique identifier for the current pod

### Optional but Recommended
- `WEBHOOK_SECRET_KEY`: Secret key for HMAC signature generation (highly recommended for security)

### Optional
- `CONFIG_ROOT`: Directory to store authentication data (default: `/root`)
- `RUNPOD_POD_ID`: Alternative pod ID source (checked if POD_ID not set)

## API Endpoints

The authentication system exposes the following endpoints:

### Frontend Endpoints
- `POST /auth/authenticate` - Authenticate with username/password
- `GET /auth/status` - Get current authentication status
- `GET /auth/check` - Quick authentication check
- `POST /auth/logout` - Logout current user

### Backend API Call
The system calls your configured `AUTH_ENDPOINT` with:
```
POST {AUTH_ENDPOINT}/pods/authenticate
{
    "podId": "your-pod-id",
    "username": "user-email-or-username", 
    "password": "user-password"
}
```

### HMAC Authentication (Recommended)
If `WEBHOOK_SECRET_KEY` is configured, the system includes an HMAC signature for secure authentication:

**Headers:**
```
Content-Type: application/json
X-Signature: sha256-hmac-signature
```

**HMAC Message Format:**
```json
{
    "pod_id": "your-pod-id",
    "timestamp": 1640995200,
    "username": "user-email-or-username",
    "action": "authenticate"
}
```

The message is JSON-stringified with sorted keys, then signed using HMAC-SHA256 with your secret key.

**Server-side HMAC Validation:**
Your backend should verify the signature by:
1. Reconstructing the message with the same format
2. Generating the HMAC signature using your secret key
3. Comparing with the provided `X-Signature` header

Expected response:
- `200 OK`: Authentication successful
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Access denied for this pod

## How It Works

1. **Startup Check**: When ComfyUI loads, the system checks if the user is already authenticated
2. **Modal Display**: If not authenticated, a beautiful modal prompts for credentials
3. **API Authentication**: Credentials are sent to your configured AUTH_ENDPOINT
4. **State Persistence**: Authentication status is stored locally for future sessions
5. **Access Control**: Only authenticated users can proceed to use ComfyUI

## Modal Features

- **Loading Indicators**: Shows authentication progress with animated loading state
- **Error Handling**: Displays clear error messages for failed authentication
- **Success Feedback**: Confirms successful authentication before hiding modal
- **Responsive Design**: Works on desktop and mobile devices
- **Security Icons**: Visual indicators for secure connection
- **Auto-focus**: Username field is automatically focused when modal appears

## Customization

### Styling
The modal uses inline styles for easy customization. Key style areas:
- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Button colors: Success green (#4CAF50) with hover effects
- Error/Success message styling with appropriate colors

### Timeout Configuration
Authentication requests have a 30-second timeout by default. This can be modified in `nodes.py`.

## Security

- Authentication status is stored locally on the pod
- Passwords are transmitted securely via HTTPS
- HMAC signatures prevent request tampering and replay attacks
- No credentials are logged or stored permanently
- Session data is cleared on logout
- Pod ID detection uses multiple fallback methods for reliability

## HMAC Security Details

When `WEBHOOK_SECRET_KEY` is configured:
- Each authentication request includes a cryptographic signature
- Prevents unauthorized access even if network traffic is intercepted
- Includes timestamp to prevent replay attacks
- Uses SHA-256 for strong cryptographic security
- Message format matches idle-checker implementation for consistency

## Debugging

For debugging purposes, you can manually trigger logout:
```javascript
// In browser console
window.comfyAuthLogout();
```

## Troubleshooting

### Modal doesn't appear
- Check browser console for JavaScript errors
- Verify ComfyUI is fully loaded before authentication check
- Ensure custom node is properly installed

### Authentication fails
- Verify `AUTH_ENDPOINT` environment variable is set correctly
- Check network connectivity to authentication server
- Verify API endpoint returns expected response format
- Check browser network tab for detailed error responses

### Pod ID issues
- Ensure `POD_ID` environment variable is set
- Verify the pod ID matches what your backend expects
- System will fall back to `RUNPOD_POD_ID` if `POD_ID` not set
- Check `/runpod-volume/runpod.json` for metadata file detection

### HMAC signature issues
- Verify `WEBHOOK_SECRET_KEY` is set on both client and server
- Ensure the secret key is identical on both sides
- Check server logs for signature validation details
- Verify your server implements the same HMAC message format
- Message should be JSON with sorted keys: `{"action":"authenticate","pod_id":"...","timestamp":123,"username":"..."}`

## License

[Add your license information here]
