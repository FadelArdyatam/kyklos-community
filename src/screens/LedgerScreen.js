import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';

const LedgerScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLedger = async () => {
      if (!activeCommunity?.id) return;
      try {
        setLoading(true);
        const dashboard = await communityService.getDashboard(activeCommunity.id);
        setTransactions(dashboard.recentTransactions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadLedger();
  }, [activeCommunity?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Buku Kas Global</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {transactions.map((t, idx) => (
            <View key={idx} style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>{t.note || (t.direction === 'in' ? 'Pemasukan' : 'Pengeluaran')}</Text>
                <Text style={styles.cardSubtitle}>{new Date(t.createdAt).toLocaleDateString()} • {t.pocket?.name || 'Kas Umum'}</Text>
              </View>
              <Text style={[styles.cardAmount, { color: t.direction === 'in' ? '#10b981' : '#ef4444' }]}>
                {t.direction === 'in' ? '+' : '-'} Rp {Number(t.amount).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && <Text style={styles.emptyText}>Belum ada riwayat transaksi.</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContainer: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardSubtitle: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  cardAmount: { fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#6c757d', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});
export default LedgerScreen;
