import React, { useState, createContext, useContext, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import GuardLoginScreen from '../components/GuardLoginScreen';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// --- Authentication Context ---
// This allows different parts of the app to know if the user is logged in.
const AuthContext = createContext<{
  signIn: (token: string, tenantSubdomain?: string) => void;
  signOut: () => void;
  token: string | null;
  tenantSubdomain: string | null;
}>({
  signIn: () => {},
  signOut: () => {},
  token: null,
  tenantSubdomain: null,
});

// This hook can be used by any component to access auth functions
export const useAuth = () => {
  return useContext(AuthContext);
};

// Main App Component with Theme
const MainApp = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';
    
    // If the user is not logged in and is trying to access a protected screen,
    // redirect them to the login screen.
    if (!authToken && inAuthGroup) {
      // The login screen is outside the '(tabs)' group, so we replace the current route.
    } else if (authToken && !inAuthGroup) {
      // If the user is logged in, send them to the main check-in screen.
      router.replace('/(tabs)');
    }
  }, [authToken, segments]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <AuthContext.Provider
        value={{
          signIn: (token, subdomain) => {
            setAuthToken(token);
            setTenantSubdomain(subdomain || 'dev');
          },
          signOut: () => {
            setAuthToken(null);
            setTenantSubdomain(null);
          },
          token: authToken,
          tenantSubdomain: tenantSubdomain,
        }}
      >
        {/* If the user is logged in, show the main tabbed layout. Otherwise, show the login screen. */}
        {authToken ? (
          <Stack screenOptions={{ headerShown: false }} />
        ) : (
          <GuardLoginScreen />
        )}
      </AuthContext.Provider>
      <Toast />
    </>
  );
};

// --- Root Layout Component ---
const RootLayout = () => {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
};

export default RootLayout;

