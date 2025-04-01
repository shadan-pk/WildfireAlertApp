import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { currentLocation, locationUpdateEnabled } = useLocationTracking();
  const { updateOnlineStatus } = useOnlineStatus();
  const [profile, setProfile] = useState({});
  const [status, setStatus] = useState("Safe");
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState({});
  const mapRef = useRef(null);
  
  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulsing animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ])
    );
    
    pulse.start();
    
    return () => pulse.stop();
  }, [pulseAnim]);
  
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

  // Add useEffect to listen for safety status changes
  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.email) return;

    // Set up real-time listener for safety status
    const unsubscribe = onSnapshot(
      doc(FIREBASE_DB, "userLocation", currentUser.email, "situation", "SafeOrNot"),
      (doc) => {
        if (doc.exists()) {
          const isSafe = doc.data().safe;
          setStatus(isSafe ? "Safe" : "Unsafe");
        }
      },
      (error) => {
        console.error("Error fetching safety status:", error);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Render home content
  const renderHomeContent = () => (
    <View style={styles.homeContentContainer}>
      {/* Status Display - New Pulsing Design */}
      <View style={styles.statusWrapper}>
        <Animated.View 
          style={[
            styles.pulsingCircle,
            { 
              transform: [{ scale: pulseAnim }],
              backgroundColor: status === "Safe" ? 'rgba(67, 160, 71, 0.2)' : 'rgba(255, 82, 82, 0.2)',
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.p,styles.pulsingCircleInner,
            { 
              transform: [{ scale: pulseAnim }],
              backgroundColor: status === "Safe" ? 'rgba(67, 160, 71, 0.4)' : 'rgba(255, 82, 82, 0.4)',
            }
          ]}
        />
        <View style={styles.statusContainer}>
          <View style={[
            styles.shieldContainer,
            { backgroundColor: status === "Safe" ? '#43A047' : '#FF5252' }
          ]}>
            <FontAwesome5
              name={status === "Safe" ? "shield-alt" : "fire-alt"} 
              size={32} 
              color="#fff" 
            />
          </View>
          <Text style={styles.statusText}>
            {status}
          </Text>
        </View>
      </View>
  
      {/* Container for Map (Labeled "2" in the sketch) */}
      <View style={styles.mapWrapper}>
        <View style={styles.mapContainer}>
          {currentLocation ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              camera={{
                center: {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                },
                pitch: 85, // This creates the 3D effect (0-60 degrees)
                heading: 0, // Camera direction (0 is north)
                altitude: 1000, // Optional: altitude in meters
                zoom: 18, // Zoom level
              }}
              customMapStyle={mapStyle}
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
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </View>
      </View>
  
      {/* Report Button */}
      <TouchableOpacity 
        style={styles.reportButton}
        onPress={() => router.push('/(app)/report')}
      >
        <FontAwesome5 name="exclamation-circle" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Render profile content
  const renderProfileContent = () => (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <FontAwesome5 name="user-circle" size={80} color="#f0f0f0" />
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
              placeholderTextColor="#6c6c6c"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Last Name</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.lastName}
              onChangeText={(text) => setEditableProfile({...editableProfile, lastName: text})}
              placeholderTextColor="#6c6c6c"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.location}
              onChangeText={(text) => setEditableProfile({...editableProfile, location: text})}
              placeholderTextColor="#6c6c6c"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.formInput}
              value={editableProfile.phone}
              onChangeText={(text) => setEditableProfile({...editableProfile, phone: text})}
              keyboardType="phone-pad"
              placeholderTextColor="#6c6c6c"
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
            <FontAwesome5 name="envelope" size={18} color="#999" style={styles.infoIcon} />
            <Text style={styles.infoText}>{profile.email}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <FontAwesome5 name="map-marker-alt" size={18} color="#999" style={styles.infoIcon} />
            <Text style={styles.infoText}>{profile.location || "No address set"}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <FontAwesome5 name="phone" size={18} color="#999" style={styles.infoIcon} />
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

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={[styles.navButton, activeTab === 'home' && styles.activeNavButton]} 
            onPress={() => setActiveTab('home')}
          >
            <FontAwesome5 
              name="home" 
              size={20} 
              color={activeTab === 'home' ? "#fff" : "#aaa"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sosButton} 
            onPress={() => router.push('/(app)/sos')}
          >
            <FontAwesome5 
              name="exclamation-triangle" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, activeTab === 'profile' && styles.activeNavButton]} 
            onPress={() => setActiveTab('profile')}
          >
            <FontAwesome5 
              name="user" 
              size={20} 
              color={activeTab === 'profile' ? "#fff" : "#aaa"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Dark map style
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1A1A1A"}] // Deep black background
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}] // Icons off for cleaner look
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#FF5722"}] // Vibrant orange text
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {"color": "#000000"}, // Black stroke
      {"weight": 2}         // Thicker stroke for contrast
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#ffff"}] // Bright orange boundaries
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}] // Dark gray for landscape
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{"color": "#2C2C2C"}] // Slightly lighter black for POIs
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {"color": "#FF5722"},     // Orange roads
      {"weight": 1.5}           // Thicker roads
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {"color": "#000000"},     // Black road outlines
      {"weight": 1}
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#0A0A0A"}] // Very dark black water
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{"color": "#FFB300"}] // Amber transit lines
  }
];

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#121212', // Matt black background
  },
  homeContentContainer: {
    flex: 1,
    paddingTop: 20, // Add padding to avoid overlap with statusWrapper
  },
  // Status display styles
  statusWrapper: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 180,
    //shadow
    
  },
  pulsingCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
  },
  pulsingCircleInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 70,
    alignSelf: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shieldContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  mapWrapper: {
    marginTop: 230, // Adjust this value to position the map below the status display
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // Map styles
  mapContainer: {
    top: 70,
    width: '100%', // Full width
    height: '100%', // Full height
    borderRadius: 15, // Rounded corners
    overflow: 'hidden',
    backgroundColor: '#1c1c1c', // Background color for loading state
  
    // Shadow for Android
    elevation: 30, // Higher value for a stronger 3D effect
    backgroundColor: '#222', // Slightly lighter than pure black for depth
  },
  
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  loadingText: {
    color: '#f0f0f0',
  },
  
  // Report button
  reportButton: {
    position: 'absolute',
    bottom: 120, // Adjusted to avoid overlap with the bottom navigation
    right: 20,
    backgroundColor: '#333',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  
  // Bottom navigation
  bottomNavContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    elevation: 8,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  activeNavButton: {
    backgroundColor: '#333',
  },
  sosButton: {
    backgroundColor: '#FF5252',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  
  // Profile styles
  profileContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 30,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginTop: 10,
  },
  profileDetails: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoText: {
    color: '#f0f0f0',
    fontSize: 16,
  },
  editProfileButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutButtonText: {
    color: '#ff5252',
    fontWeight: 'bold',
  },
  
  // Form styles
  profileForm: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    color: '#999',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#333',
    color: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  formButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  formButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  formButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
};