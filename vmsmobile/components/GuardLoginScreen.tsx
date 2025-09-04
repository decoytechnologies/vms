import React, { useState, useEffect } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../app/_layout';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getThemedCardStyle, 
  getThemedInputStyle, 
  getThemedButtonStyle, 
  getThemedButtonTextStyle,
  getThemedModalStyle,
  getThemedTextStyle,
  getThemedHeaderStyle,
} from '../utils/themeUtils';

// --- API Configuration ---
// Make sure this IP is correct for your local network
// Common local network ranges: 192.168.x.x, 10.0.x.x, 172.16-31.x.x
const API_URL = 'http://192.168.0.115:8080/api';
//const API_URL = 'http://192.168.6.180:8080/api';
//const API_URL = 'http://10.0.0.115:8080/api'; // Alternative if using different network

type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
};

const GuardLoginScreen = () => {
  const { signIn } = useAuth();
  const { theme, isDark } = useTheme();
  const [guardName, setGuardName] = useState('');
  const [pin, setPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // Fetch tenants on component mount
  useEffect(() => {
    fetchTenants();
  }, []);

  // Function to test network connectivity
  const testConnection = async () => {
    try {
      console.log('Testing connection to backend...');
      const response = await fetch(`${API_URL.replace('/api', '')}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      const data = await response.json();
      console.log('Health check response:', data);
      Alert.alert('Connection Test', `Server is reachable!\nStatus: ${data.status}\nTime: ${data.timestamp}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('Connection Test Failed', `Cannot reach backend server at ${API_URL}\n\nError: ${error.message}`);
    }
  };

  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      console.log('Fetching tenants from:', `${API_URL}/public/tenants`);
      const response = await fetch(`${API_URL}/public/tenants`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tenants data received:', data);
        setTenants(data);
        // Auto-select first tenant if available
        if (data.length > 0) {
          setSelectedTenant(data[0]);
        }
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      
      // Fallback: Create a default tenant for development
      const defaultTenant: Tenant = {
        id: 'default',
        name: 'Default Tenant',
        subdomain: 'dev',
        isActive: true
      };
      setTenants([defaultTenant]);
      setSelectedTenant(defaultTenant);
      
      Alert.alert(
        'Connection Error', 
        `Failed to load tenants from server. Using default tenant for now.\n\nTo fix this:\n1. Check your network connection\n2. Ensure backend server is running\n3. Verify IP address: ${API_URL}\n\nError: ${error.message}`,
        [
          { text: 'Test Connection', onPress: testConnection },
          { text: 'Continue with Default', style: 'default' }
        ]
      );
    } finally {
      setTenantsLoading(false);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!selectedTenant) {
      Alert.alert('Error', 'Please select a tenant');
      return;
    }
    
    if (!guardName.trim()) {
      Alert.alert('Error', 'Please enter your name, email, or phone');
      return;
    }
    
    if (!pin.trim()) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }
    
    setLoginLoading(true);
    try {
      console.log('Attempting login with:', {
        url: `${API_URL}/auth/guard/login`,
        tenant: selectedTenant.subdomain,
        identifier: guardName,
      });
      
      const response = await fetch(`${API_URL}/auth/guard/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-tenant-subdomain': selectedTenant.subdomain 
        },
        body: JSON.stringify({ identifier: guardName, pin }),
      });
      
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Login failed (HTTP ${response.status})`);
      }
      
      if (data.token) {
        console.log('Login successful, token received');
        signIn(data.token, selectedTenant.subdomain);
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error', 
        `Login failed: ${error.message}\n\nPlease check:\n1. Your credentials are correct\n2. You are active in the system\n3. Backend server is running`
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <TouchableOpacity
      style={[styles.tenantItem, { borderBottomColor: theme.divider }]}
      onPress={() => {
        setSelectedTenant(item);
        setShowTenantModal(false);
      }}
    >
      <Text style={[getThemedTextStyle(theme), styles.tenantName]}>{item.name}</Text>
      <Text style={[getThemedTextStyle(theme, 'secondary'), styles.tenantSubdomain]}>{item.subdomain}</Text>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.loginContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={[getThemedHeaderStyle(theme), styles.screenTitle]}>Guard Login</Text>
            
            {/* Tenant Selection */}
            <TouchableOpacity
              style={[getThemedInputStyle(theme), styles.tenantSelector]}
              onPress={() => setShowTenantModal(true)}
              disabled={tenantsLoading}
            >
              <Ionicons name="business-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              {tenantsLoading ? (
                <ActivityIndicator size="small" color={theme.textMuted} />
              ) : (
                <Text style={[getThemedTextStyle(theme), !selectedTenant && { color: theme.placeholder }]}>
                  {selectedTenant ? selectedTenant.name : 'Select Tenant'}
                </Text>
              )}
              <Ionicons name="chevron-down-outline" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
              <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[getThemedTextStyle(theme), styles.input]}
                placeholder="Guard Name, Email, or Phone"
                placeholderTextColor={theme.placeholder}
                value={guardName}
                onChangeText={setGuardName}
                autoCapitalize="none"
              />
            </View>
            <View style={[getThemedInputStyle(theme), styles.inputGroup]}>
              <Ionicons name="key-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[getThemedTextStyle(theme), styles.input]}
                placeholder="PIN"
                placeholderTextColor={theme.placeholder}
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[getThemedButtonStyle(theme, loginLoading), styles.loginButton]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color={theme.buttonText} />
              ) : (
                <Text style={getThemedButtonTextStyle(theme, loginLoading)}>Sign In</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Tenant Selection Modal */}
      <Modal
        visible={showTenantModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTenantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[getThemedModalStyle(theme), styles.modalContainer]}>
            <View style={styles.modalHeader}>
              <Text style={[getThemedHeaderStyle(theme), styles.modalTitle]}>Select Tenant</Text>
              <TouchableOpacity
                onPress={() => setShowTenantModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={tenants}
              renderItem={renderTenantItem}
              keyExtractor={(item) => item.id}
              style={styles.tenantList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  loginContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 30 
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: 'contain', 
  },
  screenTitle: { 
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  tenantSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    paddingVertical: 0 
  },
  loginButton: { 
    width: '70%', 
    marginTop: 10 
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
  },
  closeButton: {
    padding: 5,
  },
  tenantList: {
    maxHeight: 300,
  },
  tenantItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tenantSubdomain: {
    fontSize: 14,
  },
});

export default GuardLoginScreen;