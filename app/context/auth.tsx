// context/auth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { router, useRootNavigationState, useSegments } from 'expo-router';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps your app and makes auth object available
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Handle routing based on user authentication state
  useEffect(() => {
    if (!navigationState?.key) return;
    
    const inAuthGroup = String(segments[0]) === '(auth)';
    
    if (!user && !inAuthGroup) {
      // If the user is not signed in and not on an auth screen, redirect to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // If the user is signed in and on an auth screen, redirect to home
      router.replace('/(app)/home');
    }
  }, [user, segments, navigationState?.key]);

  // Set up auth state listener
  useEffect(() => {
    const auth = FIREBASE_AUTH;
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      setIsLoading(false);
      
      // Save or remove token based on auth state
      if (authUser) {
        const token = await authUser.getIdToken();
        await SecureStore.setItemAsync('authToken', token);
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }
    });

    // Initial check for stored token
    const checkStoredToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        // Token exists but no auth user - wait for Firebase to validate
        if (token && !user) {
          console.log('Found stored token, waiting for Firebase validation');
        }
      } catch (error) {
        console.error('Error checking stored token:', error);
      }
    };

    checkStoredToken();

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await FIREBASE_AUTH.signOut();
      await SecureStore.deleteItemAsync('authToken');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default useAuth;