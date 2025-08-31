import React, { useState, createContext, useContext, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import GuardLoginScreen from '../components/GuardLoginScreen';

// --- Authentication Context ---
// This allows different parts of the app to know if the user is logged in.
const AuthContext = createContext<{
  signIn: (token: string) => void;
  signOut: () => void;
  token: string | null;
}>({
  signIn: () => {},
  signOut: () => {},
  token: null,
});

// This hook can be used by any component to access auth functions
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- Main Layout Component ---
const RootLayout = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();

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
    <AuthContext.Provider
      value={{
        signIn: (token) => setAuthToken(token),
        signOut: () => setAuthToken(null),
        token: authToken,
      }}
    >
      {/* If the user is logged in, show the main tabbed layout. Otherwise, show the login screen. */}
      {authToken ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        <GuardLoginScreen />
      )}
    </AuthContext.Provider>
  );
};

export default RootLayout;

