import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../app/_layout';

// --- API Configuration ---
// Make sure this IP is correct for your local network
const API_URL = 'http://192.168.0.115:8080/api';
//const API_URL = 'http://192.168.6.180:8080/api';
const TENANT_SUBDOMAIN = 'dev';

const GuardLoginScreen = () => {
  const { signIn } = useAuth();
  const [guardName, setGuardName] = useState('');
  const [pin, setPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/guard/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-subdomain': TENANT_SUBDOMAIN },
        body: JSON.stringify({ name: guardName, pin }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      signIn(data.token);
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.loginContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.screenTitle}>Guard Login</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Guard Name"
                placeholderTextColor="#888"
                value={guardName}
                onChangeText={setGuardName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="PIN"
                placeholderTextColor="#888"
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, styles.loginButton, loginLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  loginContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logo: {
    width: 120, // Increased size for better presence
    height: 120,
    marginBottom: 30,
    // THIS IS THE FIX:
    // 'contain' ensures the entire image fits inside the dimensions without being distorted or cropped.
    resizeMode: 'contain', 
  },
  screenTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 30, textAlign: 'center' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#E0E0E0' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 0 },
  primaryButton: { backgroundColor: '#007bff', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginButton: { width: '70%' },
  buttonDisabled: { backgroundColor: '#A0CCEE' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
});

export default GuardLoginScreen;