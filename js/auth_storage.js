/**
 * ComfyUI Auth System - localStorage Management Utilities
 * 
 * This file provides utilities for managing authentication state in localStorage
 * instead of relying on backend file storage.
 */

// Auth storage configuration
const AUTH_CONFIG = {
    STORAGE_KEY: 'comfyui_auth_data',
    EXPIRY_HOURS: 24,
    DEBUG: true
};

// Premium configuration keys
const PREMIUM_KEYS = {
    RSA_PUBLIC_KEY: 'rsaPublicKey',
    CHAT_API_KEY: 'chatApiKey',
    IS_PREMIUM: 'isPremium'
};

/**
 * Authentication Storage Manager
 */
class AuthStorageManager {
    constructor() {
        this.storageKey = AUTH_CONFIG.STORAGE_KEY;
        this.expiryHours = AUTH_CONFIG.EXPIRY_HOURS;
        this.debug = AUTH_CONFIG.DEBUG;
    }

    /**
     * Save authentication data to localStorage
     * @param {Object} userData - User authentication data
     */
    saveAuth(userData) {
        try {
            const authData = {
                ...userData,
                saved_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + (this.expiryHours * 60 * 60 * 1000)).toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(authData));
            
            if (this.debug) {
                console.log('💾 Auth data saved to localStorage:', {
                    username: authData.username,
                    saved_at: authData.saved_at,
                    expires_at: authData.expires_at
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving auth data to localStorage:', error);
            return false;
        }
    }

    /**
     * Get authentication data from localStorage
     * @returns {Object|null} Authentication data or null if not found/invalid
     */
    getAuth() {
        try {
            const authData = localStorage.getItem(this.storageKey);
            if (!authData) {
                if (this.debug) console.log('ℹ️ No auth data found in localStorage');
                return null;
            }

            const parsed = JSON.parse(authData);
            
            if (!this.isValid(parsed)) {
                this.clearAuth();
                return null;
            }

            if (this.debug) {
                console.log('✅ Valid auth data found:', {
                    username: parsed.username,
                    saved_at: parsed.saved_at
                });
            }

            return parsed;
        } catch (error) {
            console.error('❌ Error getting auth data from localStorage:', error);
            this.clearAuth();
            return null;
        }
    }

    /**
     * Check if authentication data is valid
     * @param {Object} authData - Authentication data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValid(authData) {
        if (!authData || typeof authData !== 'object') {
            return false;
        }

        // Required fields
        if (!authData.username || !authData.authenticated_at) {
            if (this.debug) console.log('❌ Missing required auth fields');
            return false;
        }

        // Check expiry
        if (authData.expires_at) {
            const expiry = new Date(authData.expires_at);
            const now = new Date();
            
            if (now > expiry) {
                if (this.debug) console.log('🕐 Auth data expired');
                return false;
            }
        } else {
            // Fallback: check based on authenticated_at time
            const authTime = new Date(authData.authenticated_at);
            const now = new Date();
            const hoursDiff = (now - authTime) / (1000 * 60 * 60);
            
            if (hoursDiff > this.expiryHours) {
                if (this.debug) console.log('🕐 Auth data expired (legacy check)');
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    isAuthenticated() {
        const authData = this.getAuth();
        return authData !== null;
    }

    /**
     * Get current user information
     * @returns {Object|null} User information or null if not authenticated
     */
    getCurrentUser() {
        const authData = this.getAuth();
        if (!authData) return null;

        return {
            username: authData.username,
            pod_id: authData.pod_id,
            session_id: authData.session_id,
            authenticated_at: authData.authenticated_at
        };
    }

    /**
     * Save premium configuration to localStorage
     * @param {Object} premiumConfig - Premium configuration data
     */
    savePremiumConfig(premiumConfig) {
        try {
            if (!premiumConfig) {
                this.clearPremiumConfig();
                return true;
            }

            if (premiumConfig.isPremium) {
                localStorage.setItem(PREMIUM_KEYS.IS_PREMIUM, 'true');
                
                if (premiumConfig.chatApiKey) {
                    localStorage.setItem(PREMIUM_KEYS.CHAT_API_KEY, premiumConfig.chatApiKey);
                }
                
                if (premiumConfig.rsaPublicKey) {
                    localStorage.setItem(PREMIUM_KEYS.RSA_PUBLIC_KEY, premiumConfig.rsaPublicKey);
                }
                
                if (this.debug) {
                    console.log('💎 Premium config saved to localStorage');
                }
            } else {
                this.clearPremiumConfig();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving premium config to localStorage:', error);
            return false;
        }
    }

    /**
     * Get premium configuration from localStorage
     * @returns {Object|null} Premium configuration or null
     */
    getPremiumConfig() {
        try {
            const isPremium = localStorage.getItem(PREMIUM_KEYS.IS_PREMIUM) === 'true';
            
            if (!isPremium) {
                return { isPremium: false };
            }

            return {
                isPremium: true,
                chatApiKey: localStorage.getItem(PREMIUM_KEYS.CHAT_API_KEY) || '',
                rsaPublicKey: localStorage.getItem(PREMIUM_KEYS.RSA_PUBLIC_KEY) || ''
            };
        } catch (error) {
            console.error('❌ Error getting premium config from localStorage:', error);
            return { isPremium: false };
        }
    }

    /**
     * Clear premium configuration from localStorage
     */
    clearPremiumConfig() {
        try {
            localStorage.removeItem(PREMIUM_KEYS.IS_PREMIUM);
            localStorage.removeItem(PREMIUM_KEYS.CHAT_API_KEY);
            localStorage.removeItem(PREMIUM_KEYS.RSA_PUBLIC_KEY);
            
            if (this.debug) {
                console.log('🧹 Premium config cleared from localStorage');
            }
        } catch (error) {
            console.error('❌ Error clearing premium config from localStorage:', error);
        }
    }

    /**
     * Check if current user has premium access
     * @returns {boolean} True if premium, false otherwise
     */
    isPremium() {
        const config = this.getPremiumConfig();
        return config.isPremium === true;
    }

    /**
     * Validate premium configuration against backend
     * @param {Object} backendConfig - Configuration from backend
     * @returns {boolean} True if configurations match
     */
    validatePremiumConfig(backendConfig) {
        const localConfig = this.getPremiumConfig();
        
        // If backend says not premium, local should also not be premium
        if (!backendConfig.isPremium) {
            return !localConfig.isPremium;
        }
        
        // If backend says premium, check if keys match
        if (backendConfig.isPremium && localConfig.isPremium) {
            return (
                localConfig.chatApiKey === backendConfig.chatApiKey &&
                localConfig.rsaPublicKey === backendConfig.rsaPublicKey
            );
        }
        
        return false;
    }

    /**
     * Sync premium configuration with backend
     * @param {Object} backendConfig - Configuration from backend
     */
    syncPremiumConfig(backendConfig) {
        const localConfig = this.getPremiumConfig();
        
        if (!this.validatePremiumConfig(backendConfig)) {
            if (this.debug) {
                console.log('🔄 Premium config mismatch, syncing with backend');
            }
            
            this.savePremiumConfig(backendConfig);
            return true;
        }
        
        return false;
    }

    /**
     * Clear authentication data from localStorage
     */
    clearAuth() {
        try {
            localStorage.removeItem(this.storageKey);
            this.clearPremiumConfig(); // Also clear premium config on logout
            if (this.debug) console.log('🧹 Auth data and premium config cleared from localStorage');
        } catch (error) {
            console.error('❌ Error clearing auth data from localStorage:', error);
        }
    }

    /**
     * Refresh authentication expiry time
     */
    refreshExpiry() {
        const authData = this.getAuth();
        if (authData) {
            authData.expires_at = new Date(Date.now() + (this.expiryHours * 60 * 60 * 1000)).toISOString();
            authData.refreshed_at = new Date().toISOString();
            
            localStorage.setItem(this.storageKey, JSON.stringify(authData));
            
            if (this.debug) {
                console.log('🔄 Auth expiry refreshed until:', authData.expires_at);
            }
        }
    }

    /**
     * Get authentication status summary
     * @returns {Object} Status summary
     */
    getStatus() {
        const authData = this.getAuth();
        const premiumConfig = this.getPremiumConfig();
        
        return {
            authenticated: authData !== null,
            username: authData?.username || null,
            pod_id: authData?.pod_id || null,
            authenticated_at: authData?.authenticated_at || null,
            expires_at: authData?.expires_at || null,
            session_id: authData?.session_id || null,
            storage_type: 'localStorage',
            expiry_hours: this.expiryHours,
            premium: premiumConfig
        };
    }

    /**
     * Debug method to dump all auth information
     */
    debugDump() {
        console.log('🔍 Auth Storage Debug Info:');
        console.log('Storage Key:', this.storageKey);
        console.log('Expiry Hours:', this.expiryHours);
        
        const rawData = localStorage.getItem(this.storageKey);
        console.log('Raw Storage Data:', rawData);
        
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                console.log('Parsed Data:', parsed);
                console.log('Is Valid:', this.isValid(parsed));
            } catch (error) {
                console.log('Parse Error:', error);
            }
        }
        
        console.log('Status:', this.getStatus());
    }
}

// Create global instance
window.comfyAuthStorage = new AuthStorageManager();

// Utility functions for global access
window.comfyAuthUtils = {
    // Check if authenticated
    isAuthenticated: () => window.comfyAuthStorage.isAuthenticated(),
    
    // Get current user
    getCurrentUser: () => window.comfyAuthStorage.getCurrentUser(),
    
    // Get status
    getStatus: () => window.comfyAuthStorage.getStatus(),
    
    // Premium utilities
    isPremium: () => window.comfyAuthStorage.isPremium(),
    getPremiumConfig: () => window.comfyAuthStorage.getPremiumConfig(),
    
    // Manual logout
    logout: () => {
        window.comfyAuthStorage.clearAuth();
        if (window.authModal) {
            window.authModal.isAuthenticated = false;
            window.authModal.showModal();
        }
        console.log('🚪 Manual logout completed');
    },
    
    // Debug info
    debug: () => window.comfyAuthStorage.debugDump(),
    
    // Refresh session
    refresh: () => window.comfyAuthStorage.refreshExpiry(),
    
    // Check premium status with backend
    checkPremium: async () => {
        try {
            const response = await fetch('/auth/premium_check');
            const backendConfig = await response.json();
            
            const synced = window.comfyAuthStorage.syncPremiumConfig(backendConfig);
            if (synced) {
                console.log('💎 Premium config synced with backend');
            }
            
            return window.comfyAuthStorage.getPremiumConfig();
        } catch (error) {
            console.error('❌ Error checking premium status:', error);
            return { isPremium: false };
        }
    }
};

// Auto-refresh session periodically if user is active
let refreshInterval;

function startAutoRefresh() {
    if (refreshInterval) return;
    
    refreshInterval = setInterval(() => {
        if (window.comfyAuthStorage.isAuthenticated()) {
            window.comfyAuthStorage.refreshExpiry();
        } else {
            stopAutoRefresh();
        }
    }, 30 * 60 * 1000); // Refresh every 30 minutes
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Start auto-refresh if authenticated
if (window.comfyAuthStorage.isAuthenticated()) {
    startAutoRefresh();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthStorageManager, AUTH_CONFIG };
}

console.log('🔐 ComfyUI Auth Storage Manager loaded');
console.log('Available utilities: window.comfyAuthUtils');
console.log('Storage manager: window.comfyAuthStorage');
