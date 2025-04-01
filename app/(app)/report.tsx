import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import ReportsModal from '../../components/ReportsModal';

export default function ReportScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);

  const getNextReportNumber = async (userEmail: string) => {
    try {
      const reportsRef = collection(FIREBASE_DB, "userLocation", userEmail, "reports");
      const metadataDoc = await getDoc(doc(reportsRef, "metadata"));
      
      if (!metadataDoc.exists()) {
        await setDoc(doc(reportsRef, "metadata"), { lastReportNumber: 1 });
        return 1;
      }
      
      const currentNumber = metadataDoc.data().lastReportNumber || 0;
      const nextNumber = currentNumber + 1;
      return nextNumber;
    } catch (error) {
      console.error("Error getting next report number:", error);
      return null;
    }
  };

  const fetchReports = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.email) return;

    try {
      const reportsRef = collection(FIREBASE_DB, "userLocation", currentUser.email, "reports");
      const q = query(reportsRef, orderBy("reportNumber", "desc"));
      const querySnapshot = await getDocs(q);
      
      const reportsList = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== 'metadata') {
          reportsList.push(doc.data());
        }
      });

      setReports(reportsList);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    if (showReports) {
      fetchReports();
    }
  }, [showReports]);

  const handleDeleteReport = (reportNumber: number) => {
    setReports(reports.filter(report => report.reportNumber !== reportNumber));
  };

  const handleReport = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.email) {
      Alert.alert("Error", "You must be logged in to submit a report");
      return;
    }

    try {
      const nextReportNumber = await getNextReportNumber(currentUser.email);
      
      if (!nextReportNumber) {
        throw new Error("Could not generate report number");
      }

      await setDoc(
        doc(FIREBASE_DB, "userLocation", currentUser.email, "reports", "metadata"),
        { lastReportNumber: nextReportNumber },
        { merge: true }
      );

      await setDoc(
        doc(FIREBASE_DB, "userLocation", currentUser.email, "reports", `report_${nextReportNumber}`),
        {
          reportNumber: nextReportNumber,
          description,
          severity,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      );

      Alert.alert(
        "Report Submitted",
        `Report #${nextReportNumber} has been submitted. Authorities have been notified.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Wildfire</Text>
        <TouchableOpacity
          style={styles.viewReportsButton}
          onPress={() => setShowReports(true)}
        >
          <Text style={styles.viewReportsText}>View My Reports</Text>
        </TouchableOpacity>
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
          placeholder="Describe the situation..."
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleReport}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Matt black background
    padding: 20,
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
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewReportsText: {
    color: '#ccc',
    fontSize: 11,
    marginRight: 5,
    // marginLeft: 5,
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
    // minHeight: '100',
    // maxHeight: '100',
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