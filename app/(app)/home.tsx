import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection } from "firebase/firestore";
import { useFocusEffect } from "expo-router";
import MapView, { Marker } from 'react-native-maps';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function HomeScreen() {
  const { currentLocation, locationUpdateEnabled } = useLocationTracking();
  const { updateOnlineStatus } = useOnlineStatus();
  const [profile, setProfile] = useState({});
  const [status, setStatus] = useState("Safe");
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState({});
  const mapRef = useRef(null);
  
  // Fetch user profile
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await updateOnlineStatus(false);
      await signOut(FIREBASE_AUTH);
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

  // Render home content
  const renderHomeContent = () => (
    <>
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        <View style={styles.shieldContainer}>
          <FontAwesome name="shield" size={24} color={status === "Safe" ? "#4CAF50" : "#FF5252"} />
        </View>
      </View>

      {/* Map Area */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
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

      {/* Location Tracking Status */}
      {!locationUpdateEnabled && (
        <View style={styles.warningBanner}>
          <FontAwesome name="exclamation-circle" size={16} color="#FFA000" />
          <Text style={styles.warningText}>Location tracking is disabled due to permission settings</Text>
        </View>
      )}

      {/* Alert Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.reportButton]}>
          <FontAwesome name="exclamation-circle" size={32} color="white" />
          <Text style={styles.buttonText}>Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.sosButton]}>
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

  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      {activeTab === 'home' ? renderHomeContent() : renderProfileContent()}

      {/* Bottom Navigation */}
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
        
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="bars" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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