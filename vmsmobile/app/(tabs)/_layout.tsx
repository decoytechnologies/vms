import { Tabs, useRouter } from 'expo-router';
import { Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout'; // Import useAuth to handle logout
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const handleLogout = () => {
    signOut();
    // After signing out, the RootLayout will automatically handle redirecting.
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.text,
        headerTitle: () => (
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ 
              width: 120, 
              height: 40, 
              resizeMode: 'contain',
              tintColor: isDark ? theme.text : undefined 
            }}
          />
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={28} color={theme.error} />
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
        name="pending"
        options={{
          title: 'Pending',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
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

