import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../FirebaseConfig';


export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationUpdateEnabled, setLocationUpdateEnabled] = useState(true);
  const locationSubscription = useRef(null);

  const updateUserLocationInFirestore = async (location) => {
    if (!locationUpdateEnabled) return;
    
    const currentUser = FIREBASE_AUTH.currentUser;
    if (currentUser?.email) {
      try {
        await setDoc(doc(FIREBASE_DB, "userLocation", currentUser.email), {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading
        });
      } catch (error) {
        console.error("Error updating location:", error);
        setLocationUpdateEnabled(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({});
        const initialLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading
        };

        if (isMounted) {
          setCurrentLocation(initialLocation);
          await updateUserLocationInFirestore(initialLocation);
        }

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10
          },
          (newLocation) => {
            const updatedLocation = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
              speed: newLocation.coords.speed,
              heading: newLocation.coords.heading
            };
            
            if (isMounted) {
              setCurrentLocation(updatedLocation);
              updateUserLocationInFirestore(updatedLocation);
            }
          }
        );
      } catch (error) {
        console.error("Error setting up location tracking:", error);
        setLocationUpdateEnabled(false);
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      locationSubscription.current?.remove();
    };
  }, [locationUpdateEnabled]);

  return {
    currentLocation,
    locationUpdateEnabled,
    setLocationUpdateEnabled
  };
};