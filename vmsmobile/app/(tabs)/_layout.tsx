import { Tabs, useRouter } from 'expo-router';
import { Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout'; // Import useAuth to handle logout

export default function TabLayout() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    // After signing out, the RootLayout will automatically handle redirecting.
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitle: () => (
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={28} color="#d9534f" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-add' : 'person-add-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          title: 'Check-out',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

