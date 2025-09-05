import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../_layout';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedCardStyle, getThemedButtonStyle, getThemedButtonTextStyle, getThemedTextStyle } from '../../utils/themeUtils';

const API_URL = 'http://192.168.0.115:8080/api';

export default function PendingScreen() {
  const { token: guardToken, tenantSubdomain } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!tenantSubdomain) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/visitors/pending`, { headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain } });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const approveNow = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/visitors/${id}/override-approve`, { method: 'POST', headers: { Authorization: `Bearer ${guardToken}`, 'x-tenant-subdomain': tenantSubdomain } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      Toast.show({ type: 'success', position: 'top', text1: 'Approved', topOffset: 60 });
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', position: 'top', text1: e.message || 'Failed', topOffset: 60 });
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[getThemedCardStyle(theme), { padding: 14, marginBottom: 10 }]}> 
      <Text style={[getThemedTextStyle(theme), { fontWeight: '600' }]}>{item.Visitor?.name}</Text>
      <Text style={[getThemedTextStyle(theme, 'secondary')]}>{item.Employee?.name || 'N/A'}{item.Employee?.email ? ` • ${item.Employee.email}` : ''}</Text>
      <Text style={[getThemedTextStyle(theme, 'secondary'), { marginTop: 2 }]}>Requested: {new Date(item.checkInTimestamp).toLocaleString()}</Text>
      <TouchableOpacity onPress={() => approveNow(item.id)} style={[getThemedButtonStyle(theme), { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14 }]}>
        <Text style={getThemedButtonTextStyle(theme)}>Approve Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {items.length === 0 ? (
        <Text style={getThemedTextStyle(theme)}>No pending approvals.</Text>
      ) : (
        <FlatList data={items} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}
    </View>
  );
}
