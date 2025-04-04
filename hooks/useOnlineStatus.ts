import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../FirebaseConfig';


export const useOnlineStatus = () => {
  const appStateSubscription = useRef(null);
  const netInfoSubscription = useRef(null);

  const updateOnlineStatus = async (isOnline: boolean) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (currentUser?.email) {
      try {
        await setDoc(
          doc(FIREBASE_DB, "userLocation", currentUser.email, "status", "presence"),
          {
            online: isOnline,
            lastSeen: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    }
  };

  useEffect(() => {
    // Handle app state changes
    appStateSubscription.current = AppState.addEventListener('change', async (nextAppState) => {
      await updateOnlineStatus(nextAppState === 'active');
    });

    // Handle network state changes
    netInfoSubscription.current = NetInfo.addEventListener(async (state) => {
      await updateOnlineStatus(state.isConnected);
    });

    // Set initial online status
    updateOnlineStatus(true);

    return () => {
      appStateSubscription.current?.remove();
      netInfoSubscription.current?.();
      updateOnlineStatus(false);
    };
  }, []);

  return { updateOnlineStatus };
};