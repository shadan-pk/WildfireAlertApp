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
        <Text style={styles.label}>Severity</Text>
        <View style={styles.severityButtons}>
          {['low', 'medium', 'high'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityButton,
                severity === level && styles.selectedSeverity,
                { backgroundColor: level === 'low' ? '#4CAF50' : level === 'medium' ? '#FFA000' : '#FF5252' }
              ]}
              onPress={() => setSeverity(level)}
            >
              <Text style={styles.severityText}>{level.toUpperCase()}</Text>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  severityButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSeverity: {
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  severityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewReportsButton: {
    backgroundColor: '#666',
    padding: 8,
    borderRadius: 5,
  },
  viewReportsText: {
    color: 'white',
    fontSize: 14,
  },
});