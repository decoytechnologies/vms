import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout'; // Import useAuth to get the token
import { useFocusEffect } from 'expo-router'; // Import useFocusEffect

// --- API Configuration ---
// REMEMBER: Replace with your Mac's IP address
const API_URL = 'http://192.168.0.115:8080/api';
const TENANT_SUBDOMAIN = 'dev';

type ActiveVisit = {
  id: string;
  Visitor: {
    name: string;
  };
  checkInTimestamp: string;
};

export default function CheckOutScreen() {
  const { token: guardToken } = useAuth();
  const [activeVisits, setActiveVisits] = useState<ActiveVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/visitors/active`, {
        headers: {
          Authorization: `Bearer ${guardToken}`,
          'x-tenant-subdomain': TENANT_SUBDOMAIN,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setActiveVisits(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load active visitors.');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect will re-run the fetch every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchActiveVisits();
    }, [guardToken]) // Re-run if the token changes
  );

  const handleCheckOut = async (visitId: string) => {
    try {
      const response = await fetch(`${API_URL}/visitors/${visitId}/checkout`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${guardToken}`,
          'x-tenant-subdomain': TENANT_SUBDOMAIN,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Check-out failed');
      }
      Alert.alert('Success', 'Visitor checked out successfully.');
      // Refresh the list after a successful checkout
      fetchActiveVisits();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading Active Visitors...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {activeVisits.length === 0 ? (
        <View style={styles.centeredContent}>
          <Ionicons name="people-circle-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No visitors are currently checked in.</Text>
        </View>
      ) : (
        <FlatList
          data={activeVisits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.visitorName}>{item.Visitor.name}</Text>
                <Text style={styles.checkInTime}>
                  Checked in: {new Date(item.checkInTimestamp).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => handleCheckOut(item.id)}
              >
                <Text style={styles.buttonText}>Check Out</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkInTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkoutButton: {
    backgroundColor: '#28a745', // Green color for check-out
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
