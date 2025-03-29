import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { HomeScreenStyles } from '../styles/HomeScreenStyles';
import { useFocusEffect, router } from "expo-router";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [profile, setProfile] = useState<{ 
    firstName?: string; 
    lastName?: string; 
    location?: string;
    email?: string;
    phone?: string;
  }>({});
  
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [status, setStatus] = useState("Safe");
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<{
    firstName?: string;
    lastName?: string;
    location?: string;
    phone?: string;
  }>({});
  
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
              const profileData = {
                firstName: data.firstName,
                lastName: data.lastName,
                location: data.address,
                email: currentUser.email,
                phone: data.phone || '',
              };
              setProfile(profileData);
              setEditableProfile(profileData);
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

  // Save profile changes
  const saveProfileChanges = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (currentUser) {
      try {
        await updateDoc(doc(FIREBASE_DB, "users", currentUser.uid), {
          firstName: editableProfile.firstName,
          lastName: editableProfile.lastName,
          address: editableProfile.location,
          phone: editableProfile.phone,
        });
        setProfile(editableProfile);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  // Navigation functions
  const navigateToSOS = () => router.push('/sos-alert');
  const navigateToReport = () => router.push('/report-incident');

  // Render home content
  const renderHomeContent = () => (
    <>
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
    </>
  );

  // Render profile content
  const renderProfileContent = () => (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <FontAwesome name="user-circle" size={80} color="#333" />
        <Text style={styles.profileName}>
          {profile.firstName} {profile.lastName}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.profileForm}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>First Name</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.firstName}
              onChangeText={(text) => setEditableProfile({...editableProfile, firstName: text})}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Last Name</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.lastName}
              onChangeText={(text) => setEditableProfile({...editableProfile, lastName: text})}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.location}
              onChangeText={(text) => setEditableProfile({...editableProfile, location: text})}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.phone}
              onChangeText={(text) => setEditableProfile({...editableProfile, phone: text})}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.formButtonGroup}>
            <TouchableOpacity 
              style={[styles.formButton, styles.cancelButton]} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.formButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.formButton, styles.saveButton]} 
              onPress={saveProfileChanges}
            >
              <Text style={styles.formButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileDetails}>
          <View style={styles.profileInfo}>
            <FontAwesome name="envelope" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{profile.email}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <FontAwesome name="map-marker" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{profile.location || "No address set"}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <FontAwesome name="phone" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{profile.phone || "No phone number set"}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton} 
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  // Render the screen
  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      {activeTab === 'home' ? renderHomeContent() : renderProfileContent()}

      {/* 5 & 6. Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'home' && styles.activeNavButton]} 
          onPress={() => setActiveTab('home')}
        >
          <FontAwesome 
            name="home" 
            size={24} 
            color={activeTab === 'home' ? "#2196F3" : "#333"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'profile' && styles.activeNavButton]} 
          onPress={() => setActiveTab('profile')}
        >
          <FontAwesome 
            name="user" 
            size={24} 
            color={activeTab === 'profile' ? "#2196F3" : "#333"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Updated styles for the revised layout
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
    //add border radius
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    //add drop shadow
    shadowColor:'#266691',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 70,
    elevation: 3,

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
  activeNavButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  profileContainer: {
    flex: 1,
    padding: 15,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileDetails: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
    width: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  editProfileButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profileForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  formButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  formButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  formButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});