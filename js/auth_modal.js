import { app } from "../../../scripts/app.js";

class AuthModal {
    constructor() {
        this.modal = null;
        this.isAuthenticated = false;
        this.checkingAuth = false;
        this.authStorageKey = 'comfyui_auth_data';
        this.init();
    }

    init() {
        // Check authentication status from localStorage first
        this.checkLocalAuthStatus();
        
        // Create modal but keep it hidden initially
        this.createModal();
        
        // Show modal if not authenticated
        if (!this.isAuthenticated) {
            this.showModal();
        } else {
            console.log('✅ User already authenticated, hiding modal');
        }
    }

    checkLocalAuthStatus() {
        // Use the global storage manager if available
        if (window.comfyAuthStorage) {
            this.isAuthenticated = window.comfyAuthStorage.isAuthenticated();
            if (this.isAuthenticated) {
                const user = window.comfyAuthStorage.getCurrentUser();
                console.log('✅ User authenticated from localStorage:', user?.username);
            } else {
                console.log('❌ No valid authentication found in localStorage');
            }
            return this.isAuthenticated;
        }
        
        // Fallback to original method
        try {
            const authData = localStorage.getItem(this.authStorageKey);
            if (authData) {
                const parsed = JSON.parse(authData);
                
                // Check if authentication data is valid and not expired
                if (this.isAuthDataValid(parsed)) {
                    this.isAuthenticated = true;
                    console.log('✅ User authenticated from localStorage:', parsed.username);
                    return true;
                } else {
                    // Remove invalid/expired auth data
                    this.clearAuthData();
                }
            }
            
            this.isAuthenticated = false;
            console.log('❌ No valid authentication found in localStorage');
            return false;
            
        } catch (error) {
            console.error('Error checking localStorage auth:', error);
            this.clearAuthData();
            this.isAuthenticated = false;
            return false;
        }
    }

    isAuthDataValid(authData) {
        // Check if authentication data is valid and not expired
        if (!authData || !authData.username || !authData.authenticated_at) {
            return false;
        }
        
        // Check if authentication is less than 24 hours old
        const authTime = new Date(authData.authenticated_at);
        const now = new Date();
        const hoursDiff = (now - authTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            console.log('🕐 Authentication expired (> 24 hours)');
            return false;
        }
        
        return true;
    }

    saveAuthData(userData) {
        // Use global storage manager if available
        if (window.comfyAuthStorage) {
            return window.comfyAuthStorage.saveAuth(userData);
        }
        
        // Fallback to original method
        try {
            const authData = {
                ...userData,
                saved_at: new Date().toISOString()
            };
            
            localStorage.setItem(this.authStorageKey, JSON.stringify(authData));
            console.log('💾 Authentication data saved to localStorage');
            return true;
            
        } catch (error) {
            console.error('Error saving auth data to localStorage:', error);
            return false;
        }
    }

    clearAuthData() {
        // Use global storage manager if available
        if (window.comfyAuthStorage) {
            window.comfyAuthStorage.clearAuth();
            return;
        }
        
        // Fallback to original method
        try {
            localStorage.removeItem(this.authStorageKey);
            console.log('🧹 Authentication data cleared from localStorage');
        } catch (error) {
            console.error('Error clearing auth data from localStorage:', error);
        }
    }

    getAuthData() {
        // Use global storage manager if available
        if (window.comfyAuthStorage) {
            return window.comfyAuthStorage.getAuth();
        }
        
        // Fallback to original method
        try {
            const authData = localStorage.getItem(this.authStorageKey);
            return authData ? JSON.parse(authData) : null;
        } catch (error) {
            console.error('Error getting auth data from localStorage:', error);
            return null;
        }
    }

    async checkAuthStatus() {
        // Legacy method - authentication is now localStorage based
        // Always check localStorage first
        return this.checkLocalAuthStatus();
    }

    createModal() {
        // Create modal overlay
        this.modal = document.createElement('div');
        this.modal.className = 'auth-modal-overlay';
        this.modal.id = 'comfyui-auth-modal';
        this.modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.9) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 2147483647 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            pointer-events: all !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;

        // Make the modal undismissable by preventing common escape methods
        this.modal.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Prevent right-click context menu on modal
        this.modal.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'auth-modal-content';
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border-radius: 12px !important;
            padding: 40px !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
            color: white !important;
            text-align: center !important;
            min-width: 400px !important;
            max-width: 500px !important;
            position: relative !important;
            pointer-events: auto !important;
        `;

        // Prevent clicking outside to close
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        modalContent.innerHTML = `
            <div class="auth-header">
                <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                    🔐 Pod Authentication
                </h2>
                <p style="margin: 0 0 30px 0; opacity: 0.9; font-size: 16px;">
                    Please enter your credentials to access this ComfyUI pod
                </p>
            </div>
            
            <form id="auth-form" style="text-align: left;">
                <div style="margin-bottom: 20px;">
                    <label for="username" style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">
                        Email / Username
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        required
                        style="
                            width: 100%;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            background: rgba(255, 255, 255, 0.9);
                            color: #333;
                            box-sizing: border-box;
                        "
                        placeholder="Enter your email or username"
                    />
                </div>
                
                <div style="margin-bottom: 30px;">
                    <label for="password" style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">
                        Password
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        required
                        style="
                            width: 100%;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            background: rgba(255, 255, 255, 0.9);
                            color: #333;
                            box-sizing: border-box;
                        "
                        placeholder="Enter your password"
                    />
                </div>
                
                <button 
                    type="submit" 
                    id="auth-submit-btn"
                    style="
                        width: 100%;
                        padding: 14px 20px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-bottom: 15px;
                    "
                >
                    <span id="btn-text">🚀 Authenticate</span>
                    <span id="btn-loader" style="display: none;">⏳ Authenticating...</span>
                </button>
            </form>
            
            <div id="auth-message" style="
                margin-top: 15px;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                display: none;
            "></div>
            
            <div style="
                margin-top: 20px;
                font-size: 12px;
                opacity: 0.7;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 15px;
            ">
                🔒 Secure connection • Your credentials are encrypted
            </div>
        `;

        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);

        // Add event listeners
        this.setupEventListeners();
        
        // Setup security measures to prevent dismissal
        this.setupSecurityMeasures();
        
        // Inject persistent CSS
        this.injectPersistentCSS();
        
        // Initially hide the modal
        this.hideModal();
    }
    
    injectPersistentCSS() {
        // Create persistent CSS that's harder to override
        const style = document.createElement('style');
        style.id = 'comfyui-auth-protection';
        style.innerHTML = `
            #comfyui-auth-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: rgba(0, 0, 0, 0.9) !important;
                z-index: 2147483647 !important;
                pointer-events: all !important;
                visibility: visible !important;
                opacity: 1 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
            }
            
            #comfyui-auth-modal .auth-modal-content {
                pointer-events: auto !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                border-radius: 12px !important;
                padding: 40px !important;
                color: white !important;
                min-width: 400px !important;
                max-width: 500px !important;
            }
            
            /* Hide other elements when modal is active */
            body.auth-modal-active > *:not(#comfyui-auth-modal):not(script):not(style) {
                pointer-events: none !important;
                user-select: none !important;
            }
            
            /* Prevent text selection in modal background */
            #comfyui-auth-modal {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }
        `;
        document.head.appendChild(style);
        this.injectedStyle = style;
    }

    setupSecurityMeasures() {
        // Prevent ESC key from closing modal
        document.addEventListener('keydown', this.preventEscape.bind(this), true);
        
        // Prevent F12/Developer tools (partial protection)
        document.addEventListener('keydown', this.preventDevTools.bind(this), true);
        
        // Disable right-click context menu globally when modal is shown
        document.addEventListener('contextmenu', this.preventContextMenu.bind(this), true);
        
        // Prevent tab navigation outside modal
        document.addEventListener('keydown', this.trapFocus.bind(this), true);
        
        // Monitor for modal removal attempts
        this.setupModalProtection();
        
        // Prevent page refresh/navigation when modal is shown
        window.addEventListener('beforeunload', this.preventUnload.bind(this));
        
        // Block common dev tool shortcuts
        this.blockDevToolShortcuts();
        
        // Add console warning and detection
        this.setupConsoleProtection();
    }
    
    setupConsoleProtection() {
        // Override console methods to detect dev tools usage
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = function(...args) {
            if (!this.isAuthenticated) {
                console.warn('🚫 Console access is monitored during authentication');
            }
            return originalLog.apply(console, args);
        }.bind(this);
        
        console.warn = function(...args) {
            return originalWarn.apply(console, args);
        };
        
        console.error = function(...args) {
            return originalError.apply(console, args);
        };
        
        // Detect dev tools opening (partial detection)
        let devtools = {
            open: false,
            orientation: null
        };
        
        const threshold = 160;
        
        setInterval(() => {
            if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devtools.open) {
                        devtools.open = true;
                        console.warn('🚫 Developer tools detected during authentication');
                        this.showMessage('🚫 Please close developer tools to continue', 'error');
                    }
                } else {
                    devtools.open = false;
                }
            }
        }, 500);
        
        // Add large console warning
        if (!this.isAuthenticated) {
            console.clear();
            console.log('%c🚫 STOP!', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cThis is a browser feature intended for developers. Authentication is required to access this ComfyUI pod.', 'color: red; font-size: 16px;');
            console.log('%cIf someone told you to copy-paste something here, it is likely a scam.', 'color: red; font-size: 16px;');
            console.log('%cPlease close the developer tools and authenticate normally.', 'color: red; font-size: 16px;');
        }
    }

    preventEscape(e) {
        if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
            if (e.key === 'Escape' || e.keyCode === 27) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }
    }

    preventDevTools(e) {
        if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
            // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                this.showMessage('🚫 Developer tools are disabled during authentication', 'error');
                return false;
            }
            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
            if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                this.showMessage('🚫 Developer tools are disabled during authentication', 'error');
                return false;
            }
            // Ctrl+U (view source)
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                e.stopPropagation();
                this.showMessage('🚫 Page source is disabled during authentication', 'error');
                return false;
            }
        }
    }

    preventContextMenu(e) {
        if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    trapFocus(e) {
        if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
            if (e.key === 'Tab') {
                const focusableElements = this.modal.querySelectorAll(
                    'input, button, textarea, select, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        }
    }

    setupModalProtection() {
        // Create a MutationObserver to watch for modal removal
        const observer = new MutationObserver((mutations) => {
            if (!this.isAuthenticated) {
                mutations.forEach((mutation) => {
                    // Check if modal was removed
                    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                        for (let node of mutation.removedNodes) {
                            if (node === this.modal || (node.querySelector && node.querySelector('#comfyui-auth-modal'))) {
                                console.warn('Authentication modal removal detected - restoring...');
                                setTimeout(() => {
                                    if (!this.isAuthenticated) {
                                        this.restoreModal();
                                    }
                                }, 100);
                                return;
                            }
                        }
                    }
                    
                    // Check if modal display was changed
                    if (mutation.type === 'attributes' && mutation.target === this.modal) {
                        if (mutation.attributeName === 'style' && this.modal.style.display !== 'flex') {
                            console.warn('Authentication modal hidden - restoring...');
                            setTimeout(() => {
                                if (!this.isAuthenticated) {
                                    this.showModal();
                                }
                            }, 100);
                        }
                    }
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Store observer reference for cleanup
        this.modalObserver = observer;
    }

    restoreModal() {
        // Re-create modal if it was removed
        if (!document.getElementById('comfyui-auth-modal')) {
            console.log('Recreating authentication modal...');
            this.createModal();
        }
        this.showModal();
    }

    preventUnload(e) {
        if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
            e.preventDefault();
            e.returnValue = 'Authentication is required to access this pod.';
            return 'Authentication is required to access this pod.';
        }
    }

    blockDevToolShortcuts() {
        // Additional protection against dev tools
        const blockedKeys = [
            { ctrl: true, shift: true, key: 'I' }, // Ctrl+Shift+I
            { ctrl: true, shift: true, key: 'J' }, // Ctrl+Shift+J
            { ctrl: true, shift: true, key: 'C' }, // Ctrl+Shift+C
            { ctrl: true, key: 'U' }, // Ctrl+U
            { key: 'F12' } // F12
        ];

        document.addEventListener('keydown', (e) => {
            if (!this.isAuthenticated && this.modal && this.modal.style.display === 'flex') {
                for (let combo of blockedKeys) {
                    let match = true;
                    if (combo.ctrl && !e.ctrlKey) match = false;
                    if (combo.shift && !e.shiftKey) match = false;
                    if (combo.alt && !e.altKey) match = false;
                    if (combo.key && e.key !== combo.key && e.code !== combo.key) match = false;

                    if (match) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this.showMessage('🚫 This action is disabled during authentication', 'error');
                        return false;
                    }
                }
            }
        }, true);
    }

    setupEventListeners() {
        const form = this.modal.querySelector('#auth-form');
        const submitBtn = this.modal.querySelector('#auth-submit-btn');
        const usernameInput = this.modal.querySelector('#username');
        const passwordInput = this.modal.querySelector('#password');

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthentication();
        });

        // Hover effects for submit button
        submitBtn.addEventListener('mouseenter', () => {
            if (!submitBtn.disabled) {
                submitBtn.style.background = '#45a049';
                submitBtn.style.transform = 'translateY(-1px)';
            }
        });

        submitBtn.addEventListener('mouseleave', () => {
            if (!submitBtn.disabled) {
                submitBtn.style.background = '#4CAF50';
                submitBtn.style.transform = 'translateY(0)';
            }
        });

        // Focus on username input when modal is shown
        usernameInput.addEventListener('focus', () => {
            usernameInput.style.background = '#fff';
        });

        passwordInput.addEventListener('focus', () => {
            passwordInput.style.background = '#fff';
        });

        // Enter key handling
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAuthentication();
            }
        });
    }

    async handleAuthentication() {
        const submitBtn = this.modal.querySelector('#auth-submit-btn');
        const btnText = this.modal.querySelector('#btn-text');
        const btnLoader = this.modal.querySelector('#btn-loader');
        const messageDiv = this.modal.querySelector('#auth-message');
        const usernameInput = this.modal.querySelector('#username');
        const passwordInput = this.modal.querySelector('#password');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.style.background = '#cccccc';
        submitBtn.style.cursor = 'not-allowed';
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        this.hideMessage();

        try {
            const response = await fetch('/auth/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.isAuthenticated = true;
                
                // Save authentication data to localStorage
                if (data.user_data) {
                    this.saveAuthData(data.user_data);
                    console.log('💾 Authentication data saved to localStorage');
                } else {
                    // Fallback: create basic auth data
                    const authData = {
                        username: username,
                        authenticated_at: new Date().toISOString(),
                        session_id: `session_${Date.now()}`
                    };
                    this.saveAuthData(authData);
                }
                
                this.showMessage('✅ Authentication successful! Welcome to ComfyUI.', 'success');
                
                // Clean up security measures immediately
                this.cleanupSecurityMeasures();
                
                // Hide modal after a short delay
                setTimeout(() => {
                    this.hideModal();
                }, 1500);
            } else {
                this.showMessage(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showMessage('❌ Network error. Please check your connection and try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.style.background = '#4CAF50';
            submitBtn.style.cursor = 'pointer';
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    showMessage(message, type) {
        const messageDiv = this.modal.querySelector('#auth-message');
        messageDiv.style.display = 'block';
        messageDiv.textContent = message;
        
        if (type === 'error') {
            messageDiv.style.background = 'rgba(244, 67, 54, 0.2)';
            messageDiv.style.border = '1px solid rgba(244, 67, 54, 0.5)';
            messageDiv.style.color = '#ffcdd2';
        } else if (type === 'success') {
            messageDiv.style.background = 'rgba(76, 175, 80, 0.2)';
            messageDiv.style.border = '1px solid rgba(76, 175, 80, 0.5)';
            messageDiv.style.color = '#c8e6c9';
        }
    }

    hideMessage() {
        const messageDiv = this.modal.querySelector('#auth-message');
        messageDiv.style.display = 'none';
    }

    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.modal.style.visibility = 'visible';
            this.modal.style.opacity = '1';
            this.modal.style.pointerEvents = 'all';
            this.modal.style.zIndex = '2147483647';
            
            // Add body class to activate CSS protection
            document.body.classList.add('auth-modal-active');
            
            // Disable body scrolling
            document.body.style.overflow = 'hidden';
            
            // Force focus trap
            setTimeout(() => {
                const usernameInput = this.modal.querySelector('#username');
                if (usernameInput) {
                    usernameInput.focus();
                }
            }, 100);
            
            // Re-apply protection in case styles were modified
            this.reapplyModalProtection();
        }
    }

    hideModal() {
        if (this.modal && this.isAuthenticated) {
            this.modal.style.display = 'none';
            
            // Remove body class
            document.body.classList.remove('auth-modal-active');
            
            // Re-enable body scrolling
            document.body.style.overflow = '';
            
            // Clean up security measures
            this.cleanupSecurityMeasures();
        }
    }
    
    reapplyModalProtection() {
        // Continuously ensure modal cannot be hidden via dev tools
        if (!this.isAuthenticated && this.modal) {
            const protectionInterval = setInterval(() => {
                if (this.isAuthenticated) {
                    clearInterval(protectionInterval);
                    return;
                }
                
                // Ensure modal is still visible and properly styled
                if (this.modal && this.modal.style.display !== 'flex') {
                    this.modal.style.display = 'flex';
                    this.modal.style.visibility = 'visible';
                    this.modal.style.opacity = '1';
                    this.modal.style.zIndex = '2147483647';
                    this.modal.style.pointerEvents = 'all';
                }
                
                // Ensure modal is still in DOM
                if (!document.getElementById('comfyui-auth-modal')) {
                    this.restoreModal();
                }
            }, 500); // Check every 500ms
            
            this.protectionInterval = protectionInterval;
        }
    }
    
    cleanupSecurityMeasures() {
        if (this.protectionInterval) {
            clearInterval(this.protectionInterval);
        }
        if (this.modalObserver) {
            this.modalObserver.disconnect();
        }
        if (this.injectedStyle) {
            this.injectedStyle.remove();
        }
        
        // Remove body class
        document.body.classList.remove('auth-modal-active');
    }

    async logout() {
        try {
            // Clear localStorage first
            this.clearAuthData();
            this.isAuthenticated = false;
            
            // Optional: notify backend (though it's no longer managing state)
            const response = await fetch('/auth/logout', {
                method: 'POST'
            });
            
            console.log('🚪 User logged out - localStorage cleared');
            
            // Show modal again
            this.showModal();
            
        } catch (error) {
            console.error('Logout error:', error);
            // Even if backend call fails, we've cleared localStorage
            this.clearAuthData();
            this.isAuthenticated = false;
            this.showModal();
        }
    }
}

// Initialize authentication system
let authModal = null;

// Register the extension with ComfyUI
app.registerExtension({
    name: "comfyui.auth.system",
    async setup() {
        // Wait a bit for ComfyUI to fully load
        setTimeout(() => {
            authModal = new AuthModal();
        }, 1000);
    }
});

// Make logout function available globally for debugging
window.comfyAuthLogout = () => {
    if (authModal) {
        authModal.logout();
    }
};
