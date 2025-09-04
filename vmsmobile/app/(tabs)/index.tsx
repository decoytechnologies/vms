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
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getThemedCardStyle, 
  getThemedInputStyle, 
  getThemedButtonStyle, 
  getThemedButtonTextStyle,
  getThemedTextStyle,
  getThemedSubheaderStyle,
} from '../../utils/themeUtils';

// --- API Configuration ---
// REMEMBER: Replace with your Mac's IP address
// Make sure this matches the IP in GuardLoginScreen.tsx
const API_URL = 'http://192.168.0.115:8080/api';
//const API_URL = 'http://192.168.6.180:8080/api';
//const API_URL = 'http://10.0.0.115:8080/api'; // Alternative if using different network

type Photo = { uri: string; width: number; height: number };
type Employee = { id: string; name: string; email: string };
type Visitor = { id: string; name: string; email: string; phone: string };

export default function CheckInScreen() {
  const { token: guardToken, tenantSubdomain } = useAuth(); // Get token from our Auth context
  const { theme, isDark } = useTheme();
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
    if (!tenantSubdomain) return;
    try {
      const response = await fetch(`${API_URL}/visitors/search-by-phone?phone=${phoneQuery}`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain },
      });
      if (response.ok) {
        const suggestions = await response.json();
        setVisitorSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch visitor suggestions:', error);
    }
  };

  const fetchEmployeeSuggestions = async (query: string) => {
    if (!tenantSubdomain) return;
    try {
      const response = await fetch(`${API_URL}/employees/search?query=${query}`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain },
      });
      if (response.ok) {
        setEmployeeSuggestions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch employee suggestions');
    }
  };

  const checkIfVisitorIsCheckedIn = async (phone: string) => {
    if (!tenantSubdomain || phone.length < 10) return null;
    try {
      console.log('Checking if visitor with phone', phone, 'is already checked in...');
      const response = await fetch(`${API_URL}/visitors/active`, {
        headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain },
      });
      if (response.ok) {
        const activeVisits = await response.json();
        console.log('Active visits received:', activeVisits.length, 'visits');
        
        // Debug: log the structure of active visits
        if (activeVisits.length > 0) {
          console.log('Sample visit structure:', JSON.stringify(activeVisits[0], null, 2));
        }
        
        const checkedInVisitor = activeVisits.find((visit: any) => {
          console.log('Checking visit:', visit.Visitor?.phone, 'against', phone);
          return visit.Visitor && visit.Visitor.phone === phone;
        });
        
        if (checkedInVisitor) {
          console.log('Found checked-in visitor:', checkedInVisitor.Visitor.name);
        } else {
          console.log('No checked-in visitor found with phone:', phone);
        }
        
        return checkedInVisitor;
      } else {
        console.error('Failed to fetch active visits, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to check visitor status:', error);
    }
    return null;
  };

  const handlePhoneChange = async (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setFormData({ ...formData, phone: numericText, name: '', email: '' }); // Clear name/email when phone changes
      
      // Check if visitor is already checked in when phone number is complete
      if (numericText.length === 10) {
        const checkedInVisitor = await checkIfVisitorIsCheckedIn(numericText);
        if (checkedInVisitor) {
          const checkInTime = new Date(checkedInVisitor.checkInTimestamp);
          const now = new Date();
          const durationMs = now.getTime() - checkInTime.getTime();
          const hours = Math.floor(durationMs / 3600000);
          const minutes = Math.floor((durationMs % 3600000) / 60000);
          const stayDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          
          Alert.alert(
            'Visitor Already Inside',
            `${checkedInVisitor.Visitor.name} is already checked in.\n\nCheck-in time: ${checkInTime.toLocaleString()}\nStay duration: ${stayDuration}\n\nPlease use the checkout option to check them out first.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }
  };

  const handleCheckIn = async () => {
    Keyboard.dismiss();
    
    if (!tenantSubdomain) {
      Alert.alert('Error', 'Tenant information missing. Please log in again.');
      return;
    }
    
    if (!visitorPhoto || !idPhoto) {
      Alert.alert('Error', 'Please provide both visitor and ID photos.');
      return;
    }
    
    // Final check if visitor is already checked in
    if (formData.phone.length === 10) {
      const checkedInVisitor = await checkIfVisitorIsCheckedIn(formData.phone);
      if (checkedInVisitor) {
        Alert.alert('Error', 'This visitor is already checked in. Please check them out first.');
        return;
      }
    }
    
    setCheckInLoading(true);
    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, (formData as any)[key]));
    submissionData.append('visitorPhoto', { uri: visitorPhoto.uri, type: 'image/jpeg', name: 'visitorPhoto.jpg' } as any);
    submissionData.append('idPhoto', { uri: idPhoto.uri, type: 'image/jpeg', name: 'idPhoto.jpg' } as any);

    try {
      const response = await fetch(`${API_URL}/visitors/check-in`, {
        method: 'POST',
        headers: { 'x-tenant-subdomain': tenantSubdomain, Authorization: `Bearer ${guardToken}` },
        body: submissionData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Check-in failed');
      Alert.alert('Success', data.message);
      setFormData({ name: '', email: '', phone: '', employeeEmail: '' });
      setVisitorPhoto(null);
      setIdPhoto(null);
      setVisitorSuggestions([]);
      setEmployeeSuggestions([]);
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

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={[getThemedCardStyle(theme), styles.card]}>
            <Text style={[getThemedSubheaderStyle(theme), styles.cardTitle]}>Visitor Details</Text>
            <View>
              <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
                <Ionicons name="call-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[getThemedTextStyle(theme), styles.input]} 
                  placeholder="Visitor's 10-Digit Phone Number" 
                  placeholderTextColor={theme.placeholder} 
                  value={formData.phone} 
                  onChangeText={handlePhoneChange} 
                  keyboardType="number-pad" 
                  maxLength={10} 
                />
              </View>
              {visitorSuggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {visitorSuggestions.map(vis => (
                    <TouchableOpacity 
                      key={vis.id} 
                      style={[styles.suggestionItem, { borderBottomColor: theme.divider }]} 
                      onPress={() => { setFormData({...formData, phone: vis.phone, name: vis.name, email: vis.email }); setVisitorSuggestions([]); }}
                    >
                      <Text style={[getThemedTextStyle(theme), styles.suggestionText]}>
                        {vis.name} <Text style={[getThemedTextStyle(theme, 'secondary'), styles.suggestionEmail]}>({vis.phone})</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
              <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[getThemedTextStyle(theme), styles.input]} 
                placeholder="Full Name" 
                placeholderTextColor={theme.placeholder} 
                value={formData.name} 
                onChangeText={(text) => setFormData({...formData, name: text})} 
                autoCapitalize="words"
              />
            </View>
            <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
              <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[getThemedTextStyle(theme), styles.input]} 
                placeholder="Email" 
                placeholderTextColor={theme.placeholder} 
                value={formData.email} 
                onChangeText={(text) => setFormData({...formData, email: text})} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={[getThemedCardStyle(theme), styles.card]}>
            <Text style={[getThemedSubheaderStyle(theme), styles.cardTitle]}>Host Employee</Text>
            <View>
              <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
                <Ionicons name="business-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[getThemedTextStyle(theme), styles.input]} 
                  placeholder="Employee Email or Name" 
                  placeholderTextColor={theme.placeholder} 
                  value={formData.employeeEmail} 
                  onChangeText={(text) => setFormData({...formData, employeeEmail: text})} 
                  autoCapitalize="none"
                />
              </View>
              {employeeSuggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {employeeSuggestions.map(emp => (
                    <TouchableOpacity 
                      key={emp.id} 
                      style={[styles.suggestionItem, { borderBottomColor: theme.divider }]} 
                      onPress={() => { setFormData({...formData, employeeEmail: emp.email }); setEmployeeSuggestions([]); }}
                    >
                      <Text style={[getThemedTextStyle(theme), styles.suggestionText]}>
                        {emp.name} <Text style={[getThemedTextStyle(theme, 'secondary'), styles.suggestionEmail]}>({emp.email})</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={[getThemedCardStyle(theme), styles.card]}>
            <Text style={[getThemedSubheaderStyle(theme), styles.cardTitle]}>Capture Photos</Text>
            <View style={[styles.cameraPreviewContainer, { backgroundColor: theme.surface }]}>
              <CameraView style={styles.camera} facing="back" ref={cameraRef} />
            </View>
            <View style={styles.captureButtonsContainer}>
              <TouchableOpacity style={[getThemedButtonStyle(theme), styles.captureButton]} onPress={() => takePicture(setVisitorPhoto)}>
                <Ionicons name="camera-outline" size={24} color={theme.buttonText} />
                <Text style={[getThemedButtonTextStyle(theme), styles.captureButtonText]}>Visitor Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[getThemedButtonStyle(theme), styles.captureButton]} onPress={() => takePicture(setIdPhoto)}>
                <Ionicons name="id-card-outline" size={24} color={theme.buttonText} />
                <Text style={[getThemedButtonTextStyle(theme), styles.captureButtonText]}>ID Photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewsContainer}>
              <View style={[styles.previewBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {visitorPhoto ? (
                  <Image source={{ uri: visitorPhoto.uri }} style={styles.previewImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={60} color={theme.textMuted} />
                )}
                <Text style={[getThemedTextStyle(theme, 'secondary'), styles.previewLabel]}>Visitor</Text>
              </View>
              <View style={[styles.previewBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {idPhoto ? (
                  <Image source={{ uri: idPhoto.uri }} style={styles.previewImage} />
                ) : (
                  <Ionicons name="image-outline" size={60} color={theme.textMuted} />
                )}
                <Text style={[getThemedTextStyle(theme, 'secondary'), styles.previewLabel]}>ID</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={[getThemedButtonStyle(theme, checkInLoading), styles.primaryButton]} 
            onPress={handleCheckIn} 
            disabled={checkInLoading}
          >
            {checkInLoading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={getThemedButtonTextStyle(theme, checkInLoading)}>Submit Check-In</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  scrollViewContent: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 40 
  },
  card: { 
    marginBottom: 20 
  },
  cardTitle: { 
    marginBottom: 15 
  },
  inputGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    paddingVertical: 0 
  },
  cameraPreviewContainer: { 
    width: '100%', 
    height: 250, 
    borderRadius: 10, 
    overflow: 'hidden', 
    marginBottom: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  camera: { 
    width: '100%', 
    height: '100%' 
  },
  captureButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  captureButton: { 
    flex: 1, 
    marginHorizontal: 5, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8 
  },
  captureButtonText: { 
    fontSize: 15 
  },
  previewsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 20 
  },
  previewBox: { 
    width: '48%', 
    height: 120, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    padding: 10 
  },
  previewImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 8, 
    resizeMode: 'cover' 
  },
  previewLabel: { 
    marginTop: 8, 
    fontSize: 13, 
    fontWeight: '500' 
  },
  primaryButton: { 
    marginTop: 10 
  },
  suggestionsContainer: { 
    borderRadius: 10, 
    marginTop: -10, 
    paddingTop: 10, 
    borderWidth: 1, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5 
  },
  suggestionItem: { 
    padding: 15, 
    borderBottomWidth: 1 
  },
  suggestionText: { 
    fontSize: 16 
  },
  suggestionEmail: { 
    fontSize: 14 
  },
});

