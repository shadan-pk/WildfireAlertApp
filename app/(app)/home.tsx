import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { HomeScreenStyles } from '../styles/HomeScreenStyles';
import { useFocusEffect, router, useSegments } from "expo-router";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [profile, setProfile] = useState<{ firstName?: string; lastName?: string; location?: string }>({});
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [status, setStatus] = useState("Safe");
  const segments = useSegments();
  const isProfilePage = segments[0] === 'ProfileScreen';
  
  // Fetch user profile from Firestore
  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (currentUser) {
          try {
            const userDoc = await getDoc(doc(FIREBASE_DB, "users", currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                location: data.address,
              });
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }
      };

      fetchProfile();
    }, [])
  );

  // Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    })();
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Navigation functions
  const navigateToProfile = () => router.push('/ProfileScreen');
  const navigateToHome = () => router.push('/');
  const navigateToSOS = () => router.push('/sos-alert');
  const navigateToReport = () => router.push('/report-incident');
  const navigateToMenu = () => router.push('/menu');

  // Render the screen
  return (
    <View style={styles.container}>
      {/* 1. Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        <View style={styles.shieldContainer}>
          <FontAwesome name="shield" size={24} color={status === "Safe" ? "#4CAF50" : "#FF5252"} />
        </View>
      </View>

      {/* 2. Map Area */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
              }}
              title="Your Location"
            />
          </MapView>
        ) : (
          <View style={styles.loadingMap}>
            <Text>Loading map...</Text>
          </View>
        )}
      </View>

      {/* 3 & 4. Alert Buttons Container */}
      <View style={styles.buttonsContainer}>
        {/* 4. Report Button */}
        <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={navigateToReport}>
          <FontAwesome name="exclamation-circle" size={32} color="white" />
          <Text style={styles.buttonText}>Report</Text>
        </TouchableOpacity>

        {/* 3. SOS Button */}
        <TouchableOpacity style={[styles.actionButton, styles.sosButton]} onPress={navigateToSOS}>
          <FontAwesome name="exclamation-triangle" size={32} color="white" />
          <Text style={styles.buttonText}>SOS Alert</Text>
        </TouchableOpacity>
      </View>

      {/* 5 & 6. Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={navigateToHome}>
          <FontAwesome name="home" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={navigateToProfile}>
          <FontAwesome name="user" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// New styles for the updated layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  shieldContainer: {
    padding: 10,
  },
  mapContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    margin: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  reportButton: {
    backgroundColor: '#2196F3',
  },
  sosButton: {
    backgroundColor: '#FF5252',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});