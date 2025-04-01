import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../FirebaseConfig';

const { width, height } = Dimensions.get('window');

// Component for displaying existing reports
const ReportsModal = ({ visible, onClose, reports, userEmail, onDelete }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>My Reports</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {reports.length === 0 ? (
          <Text style={styles.noReportsText}>No reports yet</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.reportItem}>
                <View style={styles.reportHeader}>
                  <View style={[
                    styles.severityIndicator, 
                    { backgroundColor: item.severity === 'low' 
                      ? '#4CAF50' 
                      : item.severity === 'medium' 
                        ? '#FFA000' 
                        : '#FF5252' 
                    }
                  ]} />
                  <Text style={styles.reportTimestamp}>
                    {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'Unknown date'}
                  </Text>
                </View>
                <Text style={styles.reportDescription}>{item.description}</Text>
                {item.reporter === userEmail && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => onDelete(item.id)}
                  >
                    <FontAwesome name="trash" size={16} color="#fff" />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>
    </View>
  </Modal>
);

export default function ReportScreen() {
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);

  // Get reports on screen focus
  useEffect(() => {
    fetchReports();
    // Get current location from the app's location tracker
    // This would be integrated with your location tracking system
  }, []);

  const fetchReports = async () => {
    try {
      const userEmail = FIREBASE_AUTH.currentUser?.email;
      if (!userEmail) return;
      
      const q = query(collection(FIREBASE_DB, "reports"), where("reporter", "==", userEmail));
      const querySnapshot = await getDocs(q);
      
      const reportsList = [];
      querySnapshot.forEach((doc) => {
        reportsList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by timestamp, newest first
      reportsList.sort((a, b) => b.timestamp - a.timestamp);
      setReports(reportsList);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleReport = async () => {
    if (!description.trim()) {
      // Show validation error
      return;
    }

    setIsSubmitting(true);

    try {
      const userEmail = FIREBASE_AUTH.currentUser?.email;
      if (!userEmail) return;

      // Add report to Firestore
      await addDoc(collection(FIREBASE_DB, "reports"), {
        severity,
        description,
        timestamp: serverTimestamp(),
        reporter: userEmail,
        location: location || { latitude: 0, longitude: 0 },
      });

      // Clear form
      setDescription('');
      setSeverity('medium');
      setIsSubmitting(false);
      
      // Refresh reports list
      fetchReports();
      
      // Show success message or navigate back
      router.back();
    } catch (error) {
      console.error("Error submitting report:", error);
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteDoc(doc(FIREBASE_DB, "reports", reportId));
      // Update state to remove deleted report
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <FontAwesome name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Incident</Text>
          <TouchableOpacity
            style={styles.viewReportsButton}
            onPress={() => setShowReports(true)}
          >
            <Text style={styles.viewReportsText}>View My Reports</Text>
            <FontAwesome name="angle-right" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {/* Current Location Map Preview */}
        <View style={styles.mapPreviewContainer}>
          <MapView
            style={styles.mapPreview}
            initialRegion={{
              latitude: location?.latitude || 37.7749,
              longitude: location?.longitude || -122.4194,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            customMapStyle={darkMapStyle}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                title="Your Location"
              />
            )}
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.locationText}>Current Location</Text>
          </View>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>Incident Severity</Text>
          <View style={styles.severityContainer}>
            {['low', 'medium', 'high'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  severity === level && styles.selectedSeverity,
                ]}
                onPress={() => setSeverity(level)}
              >
                <View style={[
                  styles.severityDot, 
                  { backgroundColor: level === 'low' 
                    ? '#4CAF50' 
                    : level === 'medium' 
                      ? '#FFA000' 
                      : '#FF5252' 
                  }
                ]} />
                <Text style={[
                  styles.severityText,
                  severity === level && styles.selectedSeverityText
                ]}>
                  {level === 'low' ? 'Minor' : level === 'medium' ? 'Moderate' : 'Severe'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you see and any important details..."
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submittingButton]}
            onPress={handleReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <FontAwesome name="exclamation-circle" size={18} color="#fff" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ReportsModal
        visible={showReports}
        onClose={() => setShowReports(false)}
        reports={reports}
        userEmail={FIREBASE_AUTH.currentUser?.email}
        onDelete={handleDeleteReport}
      />
    </View>
  );
}

// Dark styled map for night mode
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Matt black background
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginTop: 30,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewReportsText: {
    color: '#ccc',
    fontSize: 14,
    marginRight: 5,
  },
  mapPreviewContainer: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    paddingTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  severityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSeverity: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedSeverityText: {
    color: '#fff',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 30,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingVertical: 16,
  },
  submittingButton: {
    backgroundColor: '#8B0000',
  },
  submitIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.6,
    maxHeight: height * 0.8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  noReportsText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  reportItem: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  reportTimestamp: {
    color: '#999',
    fontSize: 12,
  },
  reportDescription: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    padding: 5,
  },
  deleteText: {
    color: '#FF5252',
    fontSize: 14,
    marginLeft: 5,
  },
});