// Mobile App API Configuration
// This file centralizes API configuration for the mobile app

// --- Network Configuration ---
// Instructions for finding your IP address:
// 1. Windows: Open Command Prompt, type 'ipconfig', look for IPv4 Address
// 2. macOS/Linux: Open Terminal, type 'ifconfig' or 'ip addr show'
// 3. Alternative: Go to System Preferences > Network (macOS) or Network Settings (Windows)

// Common local network IP ranges:
// - 192.168.x.x (most home networks)
// - 10.0.x.x (some corporate networks)
// - 172.16.x.x to 172.31.x.x (Docker/corporate networks)

// IMPORTANT: Replace this IP address with your computer's actual IP address
const BASE_URL = 'http://192.168.0.115:8080';

// Export API configuration
export const API_CONFIG = {
  BASE_URL,
  API_URL: `${BASE_URL}/api`,
  HEALTH_URL: `${BASE_URL}/health`,
  
  // Default tenant for fallback
  DEFAULT_TENANT: {
    id: 'default',
    name: 'Default Tenant',
    subdomain: 'dev',
    isActive: true
  }
};

// Helper function to test API connectivity
export const testApiConnection = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log('Testing API connection to:', API_CONFIG.HEALTH_URL);
    const response = await fetch(API_CONFIG.HEALTH_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout for React Native
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API connection test successful:', data);
    
    return {
      success: true,
      message: `Server is reachable!\nStatus: ${data.status}\nTime: ${data.timestamp}`,
      data
    };
  } catch (error: any) {
    console.error('API connection test failed:', error);
    return {
      success: false,
      message: `Cannot reach backend server at ${API_CONFIG.BASE_URL}\n\nError: ${error.message}\n\nTroubleshooting:\n1. Check if backend server is running\n2. Verify IP address is correct\n3. Ensure your device and computer are on the same network\n4. Check firewall settings`
    };
  }
};

export default API_CONFIG;
