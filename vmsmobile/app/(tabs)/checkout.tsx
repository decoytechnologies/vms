import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView, TouchableWithoutFeedback, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getThemedCardStyle, 
  getThemedButtonStyle, 
  getThemedButtonTextStyle,
  getThemedTextStyle,
  getThemedHeaderStyle,
  getThemedModalStyle,
  getThemedInputStyle,
} from '../../utils/themeUtils';

// --- API Configuration ---
// Make sure this matches the IP in GuardLoginScreen.tsx and index.tsx
const API_URL = 'http://192.168.0.115:8080/api';
//const API_URL = 'http://192.168.6.180:8080/api';
//const API_URL = 'http://10.0.0.115:8080/api'; // Alternative if using different network

// --- Type Definitions ---
interface ActiveVisit {
  id: string;
  checkInTime: string;
  Visitor: {
    name: string;
  };
  Employee: {
    name: string;
    email: string;
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
  const { token: guardToken, tenantSubdomain } = useAuth();
  const { theme, isDark } = useTheme();
  const [details, setDetails] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && visitId && tenantSubdomain) {
      setLoading(true);
      fetch(`${API_URL}/visitors/details/${visitId}`, {
        headers: { 'Authorization': `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch details");
        return res.json();
      })
      .then((data: VisitDetails) => setDetails(data))
      .catch((err) => {
        Toast.show({
          type: 'error',
          text1: 'Error Loading Details',
          text2: err.message || 'Could not load visitor details',
          position: 'top',
          visibilityTime: 4000,
          topOffset: 60,
        });
      })
      .finally(() => setLoading(false));
    }
  }, [visible, visitId, guardToken, tenantSubdomain]);
  
  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: 'success',
      text1: 'Email Copied!',
      text2: 'Email address copied to clipboard',
      position: 'top',
      visibilityTime: 2000,
      topOffset: 60,
    });
  };

  const modalStyle = getThemedModalStyle(theme);
  const textStyle = getThemedTextStyle(theme);
  const headerStyle = getThemedHeaderStyle(theme);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.modalContainer, { backgroundColor: theme.modal }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Visitor Details</Text>
            {loading ? <ActivityIndicator size="large" color={theme.primary} /> : details ? (
              <ScrollView>
                <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Name:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{details.visitorName}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Email:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{details.visitorEmail}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Phone:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{details.visitorPhoneMasked}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Host:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{details.hostName}</Text>
                </View>
                
                {/* Host Email with Copy Button */}
                <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Host Email:</Text>
                  <TouchableOpacity onPress={() => handleCopyToClipboard(details.hostEmail)} style={styles.copyableValueContainer}>
                    <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{details.hostEmail}</Text>
                    <Ionicons name="copy-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.modalSectionTitle, { color: theme.text, borderTopColor: theme.divider }]}>Visitor Photo</Text>
                <Image source={{ uri: details.visitorPhotoUrl }} style={[styles.modalImage, { backgroundColor: theme.surface }]} />
                
                <Text style={[styles.modalSectionTitle, { color: theme.text, borderTopColor: theme.divider }]}>ID Card Photo</Text>
                <Image source={{ uri: details.idPhotoUrl }} style={[styles.modalImage, { backgroundColor: theme.surface }]} />
              </ScrollView>
            ) : <Text style={{ color: theme.text }}>No details found.</Text>}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

// --- Helper Functions ---
const calculateStayTime = (checkInTime: string): string => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const diffMs = now.getTime() - checkIn.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

// --- Main Checkout Screen ---
export default function CheckoutScreen() {
  const { token: guardToken, tenantSubdomain } = useAuth();
  const { theme, isDark } = useTheme();
  const [activeVisits, setActiveVisits] = useState<ActiveVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isFocused = useIsFocused();

  const fetchActiveVisits = async () => {
    if (!guardToken || !tenantSubdomain) {
      console.log('Missing token or tenant subdomain');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching active visits with tenant:', tenantSubdomain);
      const response = await fetch(`${API_URL}/visitors/active`, {
        headers: { 
          Authorization: `Bearer ${guardToken}`, 
          'x-tenant-subdomain': tenantSubdomain 
        },
      });
      console.log('Active visits response status:', response.status);
      const data = await response.json();
      console.log('Active visits data:', data);
      
      if (response.ok) {
        setActiveVisits(data);
      } else {
        console.error('Failed to fetch active visitors:', data);
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Visitors',
          text2: data.message || 'Unknown error occurred',
          position: 'top',
          visibilityTime: 4000,
          topOffset: 60,
        });
      }
    } catch (error) {
      console.error('Network error fetching active visits:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Could not connect to the server',
        position: 'top',
        visibilityTime: 4000,
        topOffset: 60,
      });
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
    if (!tenantSubdomain) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Tenant information missing. Please log in again.',
        position: 'top',
        visibilityTime: 4000,
        topOffset: 60,
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/visitors/${visitId}/checkout`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${guardToken}`, 
          'x-tenant-subdomain': tenantSubdomain 
        },
      });
      if (!response.ok) throw new Error("Check-out failed.");
      Toast.show({
        type: 'success',
        text1: 'Check-out Successful!',
        text2: 'Visitor has been checked out',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 60,
      });
      fetchActiveVisits(); // Refresh list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Check-out Failed',
        text2: error.message || 'Unable to check out visitor',
        position: 'top',
        visibilityTime: 4000,
        topOffset: 60,
      });
    }
  };

  const handleCopyEmail = async (email: string) => {
    await Clipboard.setStringAsync(email);
    Toast.show({
      type: 'success',
      text1: 'Email Copied!',
      text2: 'Email address copied to clipboard',
      position: 'top',
      visibilityTime: 2000,
      topOffset: 60,
    });
  };

  // Filter visits based on search term
  const filteredVisits = searchTerm.length >= 3 
    ? activeVisits.filter(visit => 
        visit.Visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (visit.Employee?.name && visit.Employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (visit.Employee?.email && visit.Employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : activeVisits;

  const containerStyle = getThemedCardStyle(theme);
  const textStyle = getThemedTextStyle(theme);
  const inputStyle = getThemedInputStyle(theme);
  const buttonStyle = getThemedButtonStyle(theme);
  const buttonTextStyle = getThemedButtonTextStyle(theme);

  const renderItem = ({ item }: { item: ActiveVisit }) => (
    <View style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity onPress={() => setSelectedVisitId(item.id)} style={styles.nameContainer}>
        <Text style={[styles.visitorName, { color: theme.text }]}>{item.Visitor.name}</Text>
        <Text style={[styles.stayTime, { color: theme.textMuted }]}>
          Stay: {calculateStayTime(item.checkInTimestamp)}
        </Text>
        {item.Employee && (
          <View style={styles.hostInfo}>
            <Text style={[styles.hostName, { color: theme.textSecondary }]}>
              Host: {item.Employee.name}
            </Text>
            <TouchableOpacity 
              style={styles.emailContainer} 
              onPress={() => handleCopyEmail(item.Employee.email)}
            >
              <Text style={[styles.hostEmail, { color: theme.primary }]} numberOfLines={1}>
                {item.Employee.email}
              </Text>
              <Ionicons name="copy-outline" size={16} color={theme.primary} style={styles.copyIcon} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.checkoutButton, { backgroundColor: theme.success }]} 
        onPress={() => handleCheckOut(item.id)}
      >
        <Text style={[styles.checkoutButtonText, { color: theme.buttonText }]}>Check Out</Text>
      </TouchableOpacity>
    </View>
  );

  const getEmptyMessage = () => {
    if (searchTerm.length >= 3) {
      return `No visitors found matching "${searchTerm}"`;
    }
    return "No visitors are currently checked in.";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
          <Ionicons name="search-outline" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search visitors, hosts, or emails..."
            placeholderTextColor={theme.placeholder}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <Text style={[styles.searchHint, { color: theme.textMuted }]}>
            Type at least 3 characters to search
          </Text>
        )}
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredVisits}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>{getEmptyMessage()}</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchActiveVisits}
          style={{ flex: 1 }}
        />
      )}
      {selectedVisitId && <VisitorDetailsModal visitId={selectedVisitId} visible={!!selectedVisitId} onClose={() => setSelectedVisitId(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  searchHint: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listItem: {
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  nameContainer: { 
    flex: 1,
    marginRight: 12,
  },
  visitorName: { 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 4,
  },
  stayTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  hostInfo: {
    marginTop: 4,
  },
  hostName: {
    fontSize: 14,
    marginBottom: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostEmail: {
    fontSize: 14,
    flex: 1,
    marginRight: 4,
  },
  copyIcon: {
    marginLeft: 4,
  },
  checkoutButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  checkoutButtonText: { 
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 50,
  },
  emptyText: { 
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContainer: { 
    width: '90%', 
    maxHeight: '80%', 
    borderRadius: 12, 
    padding: 20,
  },
  closeButton: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    zIndex: 1,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  modalSectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 15, 
    marginBottom: 5, 
    borderTopWidth: 1, 
    paddingTop: 10,
  },
  modalImage: { 
    width: '100%', 
    height: 200, 
    resizeMode: 'contain', 
    borderRadius: 8,
  },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    alignItems: 'center',
  },
  detailLabel: { 
    fontSize: 16,
    flex: 1,
  },
  detailValue: { 
    fontSize: 16, 
    fontWeight: '600', 
    flexShrink: 1, 
    textAlign: 'right',
    flex: 2,
  },
  copyableValueContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    flexShrink: 1,
    flex: 2,
  },
});