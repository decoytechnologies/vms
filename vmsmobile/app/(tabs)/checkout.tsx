import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Modal, Image, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

// --- API Configuration ---
// const API_URL = 'http://192.168.6.180:8080/api';
const API_URL = 'http://192.168.0.115:8080/api'; // <--- VERIFY YOUR IP HERE!
const TENANT_SUBDOMAIN = 'dev';

// --- Type Definitions ---
interface ActiveVisit {
  id: string;
  Visitor: {
    name: string;
  };
}

interface VisitDetails {
  visitorName: string;
  visitorEmail: string;
  visitorPhoneMasked: string;
  hostName: string;
  hostEmail: string; // Added host email
  checkInTime: string;
  visitorPhotoUrl: string;
  idPhotoUrl: string;
}

interface VisitorDetailsModalProps {
  visitId: string;
  visible: boolean;
  onClose: () => void;
}


// --- Visitor Details Modal Component ---
const VisitorDetailsModal = ({ visitId, visible, onClose }: VisitorDetailsModalProps) => {
  const { token: guardToken } = useAuth();
  const [details, setDetails] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && visitId) {
      setLoading(true);
      fetch(`${API_URL}/visitors/details/${visitId}`, {
        headers: { 'Authorization': `Bearer ${guardToken}`, 'x-tenant-subdomain': TENANT_SUBDOMAIN }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch details");
        return res.json();
      })
      .then((data: VisitDetails) => setDetails(data))
      .catch((err) => Alert.alert("Error", err.message || "Could not load visitor details."))
      .finally(() => setLoading(false));
    }
  }, [visible, visitId, guardToken]);
  
  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", "The email address has been copied to your clipboard.");
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#555" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Visitor Details</Text>
            {loading ? <ActivityIndicator size="large" /> : details ? (
              <ScrollView>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text><Text style={styles.detailValue}>{details.visitorName}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Email:</Text><Text style={styles.detailValue}>{details.visitorEmail}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone:</Text><Text style={styles.detailValue}>{details.visitorPhoneMasked}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Host:</Text><Text style={styles.detailValue}>{details.hostName}</Text></View>
                
                {/* Host Email with Copy Button */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Host Email:</Text>
                  <TouchableOpacity onPress={() => handleCopyToClipboard(details.hostEmail)} style={styles.copyableValueContainer}>
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">{details.hostEmail}</Text>
                    <Ionicons name="copy-outline" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSectionTitle}>Visitor Photo</Text>
                <Image source={{ uri: details.visitorPhotoUrl }} style={styles.modalImage} />
                
                <Text style={styles.modalSectionTitle}>ID Card Photo</Text>
                <Image source={{ uri: details.idPhotoUrl }} style={styles.modalImage} />
              </ScrollView>
            ) : <Text>No details found.</Text>}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

// --- Main Checkout Screen ---
export default function CheckoutScreen() {
  const { token: guardToken } = useAuth();
  const [activeVisits, setActiveVisits] = useState<ActiveVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const fetchActiveVisits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/visitors/active`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': TENANT_SUBDOMAIN },
      });
      const data = await response.json();
      if (response.ok) setActiveVisits(data);
      else Alert.alert("Error", "Failed to fetch active visitors.");
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && guardToken) {
      fetchActiveVisits();
    }
  }, [isFocused, guardToken]);

  const handleCheckOut = async (visitId: string) => {
    try {
      const response = await fetch(`${API_URL}/visitors/${visitId}/checkout`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': TENANT_SUBDOMAIN },
      });
      if (!response.ok) throw new Error("Check-out failed.");
      Alert.alert("Success", "Visitor checked out successfully.");
      fetchActiveVisits(); // Refresh list
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const renderItem = ({ item }: { item: ActiveVisit }) => (
    <View style={styles.listItem}>
      <TouchableOpacity onPress={() => setSelectedVisitId(item.id)} style={styles.nameContainer}>
        <Text style={styles.visitorName}>{item.Visitor.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkoutButton} onPress={() => handleCheckOut(item.id)}>
        <Text style={styles.checkoutButtonText}>Check Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={activeVisits}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No visitors are currently checked in.</Text></View>}
          refreshing={loading}
          onRefresh={fetchActiveVisits}
        />
      )}
      {selectedVisitId && <VisitorDetailsModal visitId={selectedVisitId} visible={!!selectedVisitId} onClose={() => setSelectedVisitId(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  listItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  nameContainer: { flex: 1 },
  visitorName: { fontSize: 18, fontWeight: '600', color: '#333' },
  checkoutButton: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  checkoutButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: '#666' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: 'white', borderRadius: 12, padding: 20 },
  closeButton: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalSectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  modalImage: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 8, backgroundColor: '#f0f0f0' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  detailLabel: { fontSize: 16, color: '#555' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#000', flexShrink: 1, textAlign: 'right' },
  copyableValueContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 1 },
});