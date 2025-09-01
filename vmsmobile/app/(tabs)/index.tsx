import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout'; // Import useAuth to get the token

// --- API Configuration ---
// REMEMBER: Replace with your Mac's IP address
const API_URL = 'http://192.168.0.115:8080/api';
//const API_URL = 'http://192.168.6.180:8080/api';
const TENANT_SUBDOMAIN = 'dev';

type Photo = { uri: string; width: number; height: number };
type Employee = { id: string; name: string; email: string };
type Visitor = { id: string; name: string; email: string; phone: string };

export default function CheckInScreen() {
  const { token: guardToken } = useAuth(); // Get token from our Auth context
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', employeeEmail: '' });
  const [visitorPhoto, setVisitorPhoto] = useState<Photo | null>(null);
  const [idPhoto, setIdPhoto] = useState<Photo | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [employeeSuggestions, setEmployeeSuggestions] = useState<Employee[]>([]);
  const [visitorSuggestions, setVisitorSuggestions] = useState<Visitor[]>([]);

  // Effect for autocomplete and returning visitor checks
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!guardToken) return;

      if (formData.phone.length >= 3) {
        fetchVisitorSuggestions(formData.phone);
      } else {
        setVisitorSuggestions([]);
      }

      if (formData.employeeEmail.length >= 3) {
        fetchEmployeeSuggestions(formData.employeeEmail);
      } else {
        setEmployeeSuggestions([]);
      }
    }, 500); // 500ms delay after user stops typing
    return () => clearTimeout(handler);
  }, [formData.phone, formData.employeeEmail, guardToken]);

  const fetchVisitorSuggestions = async (phoneQuery: string) => {
    try {
      const response = await fetch(`${API_URL}/visitors/search-by-phone?phone=${phoneQuery}`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': TENANT_SUBDOMAIN },
      });
      if (response.ok) {
        setVisitorSuggestions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch visitor suggestions:', error);
    }
  };

  const fetchEmployeeSuggestions = async (query: string) => {
    try {
      const response = await fetch(`${API_URL}/employees/search?query=${query}`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': TENANT_SUBDOMAIN },
      });
      if (response.ok) {
        setEmployeeSuggestions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch employee suggestions');
    }
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setFormData({ ...formData, phone: numericText, name: '', email: '' }); // Clear name/email when phone changes
    }
  };

  const handleCheckIn = async () => {
    Keyboard.dismiss();
    if (!visitorPhoto || !idPhoto) {
      Alert.alert('Error', 'Please provide both visitor and ID photos.');
      return;
    }
    setCheckInLoading(true);
    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, (formData as any)[key]));
    submissionData.append('visitorPhoto', { uri: visitorPhoto.uri, type: 'image/jpeg', name: 'visitorPhoto.jpg' } as any);
    submissionData.append('idPhoto', { uri: idPhoto.uri, type: 'image/jpeg', name: 'idPhoto.jpg' } as any);

    try {
      const response = await fetch(`${API_URL}/visitors/check-in`, {
        method: 'POST',
        headers: { 'x-tenant-subdomain': TENANT_SUBDOMAIN, Authorization: `Bearer ${guardToken}` },
        body: submissionData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Check-in failed');
      Alert.alert('Success', data.message);
      setFormData({ name: '', email: '', phone: '', employeeEmail: '' });
      setVisitorPhoto(null);
      setIdPhoto(null);
    } catch (error: any) {
      console.error('Check-in failed with error:', error);
      Alert.alert('Check-in Error', `Message: ${error.message}.`);
    } finally {
      setCheckInLoading(false);
    }
  };

  const takePicture = async (setter: (photo: Photo) => void) => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setter(photo);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Visitor Details</Text>
            <View>
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Visitor's 10-Digit Phone Number" placeholderTextColor="#888" value={formData.phone} onChangeText={handlePhoneChange} keyboardType="number-pad" maxLength={10} />
              </View>
              {visitorSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {visitorSuggestions.map(vis => (
                    <TouchableOpacity key={vis.id} style={styles.suggestionItem} onPress={() => { setFormData({...formData, phone: vis.phone, name: vis.name, email: vis.email }); setVisitorSuggestions([]); }}>
                      <Text style={styles.suggestionText}>{vis.name} <Text style={styles.suggestionEmail}>({vis.phone})</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputGroup}><Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#888" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} autoCapitalize="words"/></View>
            <View style={styles.inputGroup}><Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} keyboardType="email-address" autoCapitalize="none"/></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Host Employee</Text>
            <View>
              <View style={styles.inputGroup}>
                <Ionicons name="business-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Employee Email or Name" placeholderTextColor="#888" value={formData.employeeEmail} onChangeText={(text) => setFormData({...formData, employeeEmail: text})} autoCapitalize="none"/>
              </View>
              {employeeSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {employeeSuggestions.map(emp => (
                    <TouchableOpacity key={emp.id} style={styles.suggestionItem} onPress={() => { setFormData({...formData, employeeEmail: emp.email }); setEmployeeSuggestions([]); }}>
                      <Text style={styles.suggestionText}>{emp.name} <Text style={styles.suggestionEmail}>({emp.email})</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Capture Photos</Text>
            <View style={styles.cameraPreviewContainer}><CameraView style={styles.camera} facing="back" ref={cameraRef} /></View>
            <View style={styles.captureButtonsContainer}>
              <TouchableOpacity style={styles.captureButton} onPress={() => takePicture(setVisitorPhoto)}><Ionicons name="camera-outline" size={24} color="#fff" /><Text style={styles.captureButtonText}>Visitor Photo</Text></TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={() => takePicture(setIdPhoto)}><Ionicons name="id-card-outline" size={24} color="#fff" /><Text style={styles.captureButtonText}>ID Photo</Text></TouchableOpacity>
            </View>
            <View style={styles.previewsContainer}>
              <View style={styles.previewBox}>{visitorPhoto ? <Image source={{ uri: visitorPhoto.uri }} style={styles.previewImage} /> : <Ionicons name="person-circle-outline" size={60} color="#ccc" />}<Text style={styles.previewLabel}>Visitor</Text></View>
              <View style={styles.previewBox}>{idPhoto ? <Image source={{ uri: idPhoto.uri }} style={styles.previewImage} /> : <Ionicons name="image-outline" size={60} color="#ccc" />}<Text style={styles.previewLabel}>ID</Text></View>
            </View>
          </View>
          <TouchableOpacity style={[styles.primaryButton, checkInLoading && styles.buttonDisabled]} onPress={handleCheckIn} disabled={checkInLoading}>
            {checkInLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Check-In</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  scrollViewContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 15 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#E0E0E0' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 0 },
  cameraPreviewContainer: { width: '100%', height: 250, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  camera: { width: '100%', height: '100%' },
  captureButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  captureButton: { flex: 1, backgroundColor: '#556080', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  captureButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  previewsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  previewBox: { width: '48%', height: 120, backgroundColor: '#F8F9FA', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0', padding: 10 },
  previewImage: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'cover' },
  previewLabel: { marginTop: 8, fontSize: 13, color: '#555', fontWeight: '500' },
  primaryButton: { backgroundColor: '#007bff', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#A0CCEE' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  suggestionsContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginTop: -10, paddingTop: 10, borderWidth: 1, borderColor: '#E0E0E0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontSize: 16, color: '#333' },
  suggestionEmail: { color: '#777', fontSize: 14 },
});

