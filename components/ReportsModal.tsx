import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_DB } from '../FirebaseConfig';
import { doc, deleteDoc, setDoc, query, collection, getDocs, orderBy } from 'firebase/firestore';

type Report = {
  reportNumber: number;
  description: string;
  severity: string;
  timestamp: string;
  status: string;
};

type ReportsModalProps = {
  visible: boolean;
  onClose: () => void;
  reports: Report[];
  userEmail: string;
  onDelete: (reportNumber: number) => void;
};

export default function ReportsModal({ visible, onClose, reports, userEmail, onDelete }: ReportsModalProps) {
    const updateMetadataAfterDelete = async () => {
      try {
        // Get all reports sorted by timestamp
        const reportsRef = collection(FIREBASE_DB, "userLocation", userEmail, "reports");
        const q = query(reportsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        let lastReportNumber = 0;
        querySnapshot.forEach((doc) => {
          if (doc.id !== 'metadata') {
            const reportData = doc.data();
            if (reportData.reportNumber > lastReportNumber) {
              lastReportNumber = reportData.reportNumber;
            }
          }
        });
  
        // Update metadata with the last report number
        await setDoc(
          doc(FIREBASE_DB, "userLocation", userEmail, "reports", "metadata"),
          { lastReportNumber },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating metadata:", error);
      }
    };
  
    const handleDelete = (reportNumber: number) => {
      Alert.alert(
        "Delete Report",
        "Are you sure you want to delete this report?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: async () => {
              try {
                // Delete the report
                await deleteDoc(
                  doc(FIREBASE_DB, "userLocation", userEmail, "reports", `report_${reportNumber}`)
                );
                
                // Update metadata with latest report number
                await updateMetadataAfterDelete();
                
                // Update UI
                onDelete(reportNumber);
              } catch (error) {
                console.error("Error deleting report:", error);
                Alert.alert("Error", "Failed to delete report");
              }
            }
          }
        ]
      );
    };

  const renderItem = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportNumber}>Report #{item.reportNumber}</Text>
        <TouchableOpacity 
          onPress={() => handleDelete(item.reportNumber)}
          style={styles.deleteButton}
        >
          <FontAwesome name="trash" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.reportContainer}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <View 
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) }
          ]}
        >
          <Text style={styles.severityText}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFA000';
      case 'high': return '#FF5252';
      default: return '#999';
    }
  };

  return (
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
              <FontAwesome name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={reports}
            renderItem={renderItem}
            keyExtractor={(item) => `report_${item.reportNumber}`}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    //black color background
    //padding: 20,
    //borderRadius: 10,

    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#404040',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
    paddingBottom: 8,
  },
  reportNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 82, 82, 0.1)', // Slight red background
  },
  reportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    color: '#e0e0e0',
    fontWeight: '500',
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 4, 
    marginBottom:20,    // Slight letter spacing
  },
  timestamp: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  
});