import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SOSScreen() {
  const handleEmergencyCall = () => {
    Linking.openURL('tel:911');
  };

  const sendSOSAlert = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.email) return;

    try {
      const sosRef = doc(collection(FIREBASE_DB, "sosAlerts"));
      await setDoc(sosRef, {
        userId: currentUser.email,
        timestamp: serverTimestamp(),
        location: {
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        },
        status: 'active'
      });

      Alert.alert(
        "SOS Alert Sent",
        "Emergency services have been notified of your location.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send SOS alert. Please try calling emergency services directly.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Get immediate help in case of emergency</Text>
      </View>

      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergencyCall}
      >
        <FontAwesome name="phone" size={32} color="white" />
        <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
        <Text style={styles.emergencyNumber}>911</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sosButton}
        onPress={sendSOSAlert}
      >
        <FontAwesome name="exclamation-triangle" size={32} color="white" />
        <Text style={styles.sosButtonText}>Send SOS Alert</Text>
        <Text style={styles.sosDescription}>Alert nearby emergency responders</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emergencyButton: {
    backgroundColor: '#FF5252',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emergencyNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  sosButton: {
    backgroundColor: '#FFA000',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  sosDescription: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
});