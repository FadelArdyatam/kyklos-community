import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import CustomAlert from '../components/CustomAlert';

const HomeScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { activeCommunity, isLoadingCommunity } = useCommunity();

  const [dashboardData, setDashboardData] = useState(null);
  const [myContributions, setMyContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ visible: false, message: '' });

  const fetchDashboardData = async () => {
    if (!activeCommunity?.id) return;
    
    try {
      const [dashboardRes, contributionsRes] = await Promise.all([
        communityService.getDashboard(activeCommunity.id),
        communityService.getMyContributions(activeCommunity.id)
      ]);
      setDashboardData(dashboardRes);
      setMyContributions(contributionsRes);
    } catch (error) {
      console.error(error);
      setErrorAlert({
        visible: true,
        message: error.response?.data?.message || "Gagal memuat data dashboard",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeCommunity) {
      setLoading(true);
      fetchDashboardData();
    } else if (!isLoadingCommunity) {
      // Jika loading komunitas selesai tapi tidak ada komunitas
      setLoading(false);
    }
  }, [activeCommunity, isLoadingCommunity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatRupiah = (amount) => {
    if (!amount) return '0';
    return parseInt(amount).toLocaleString('id-ID');
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours === 0) return 'Baru saja';
      return `${diffInHours} jam lalu`;
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading || isLoadingCommunity) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!activeCommunity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Feather name="folder-minus" size={48} color="#adb5bd" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 16, color: '#495057', textAlign: 'center' }}>
            Kamu belum bergabung dengan komunitas apapun.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const membersCount = dashboardData?.members?.filter(m => m.status === 'active').length || 0;
  const recentTransactions = dashboardData?.recentTransactions || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {/* Top Saldo Card */}
        <View style={[styles.saldoCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.saldoLabel}>Saldo Kas Komunitas</Text>
          <Text style={styles.saldoAmount}>Rp {formatRupiah(dashboardData?.totalBalance)}</Text>
          <Text style={styles.saldoMembers}>{membersCount} anggota aktif</Text>
          

        </View>

        {/* Status Iuranku */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status Iuranku</Text>
        </View>
        <View style={styles.cardContainer}>
          {myContributions.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada tagihan untukmu saat ini.</Text>
          ) : (
            myContributions.map((cont, index) => {
              let statusText = '';
              let statusColor = '';
              let statusBg = '';

              if (cont.status === 'unpaid') {
                statusText = 'Belum Dibayar';
                statusColor = '#dc3545';
                statusBg = '#ffeaea';
              } else if (cont.status === 'pending_verify') {
                statusText = 'Diproses';
                statusColor = '#fd7e14';
                statusBg = '#fff3cd';
              } else {
                statusText = 'Lunas';
                statusColor = '#00b873';
                statusBg = '#e6f8f0';
              }

              return (
                <View key={cont.id}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{cont.schedule?.title}</Text>
                      <Text style={styles.activityTime}>Rp {formatRupiah(cont.amount)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                  </View>
                  {index < myContributions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>

        {/* Aktivitas Komunitas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktivitas Komunitas</Text>
        </View>
        
        <View style={styles.cardContainer}>
          {recentTransactions.length === 0 ? (
             <Text style={styles.emptyText}>Belum ada aktivitas.</Text>
          ) : (
            recentTransactions.map((trx, index) => {
              const isIncome = trx.direction === 'in';
              const iconColor = isIncome ? '#00b873' : '#dc3545';
              const bgColor = isIncome ? '#e6f8f0' : '#ffeaea';
              const iconName = isIncome ? 'arrow-down' : 'arrow-up';
              const amountPrefix = isIncome ? '+' : '-';
              
              return (
                <View key={trx.id}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIconCircle, { backgroundColor: bgColor }]}>
                      <Feather name={iconName} size={16} color={iconColor} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {trx.note || `Transaksi ${trx.pocket?.name || ''}`}
                      </Text>
                      <Text style={styles.activityTime}>{formatDate(trx.createdAt)}</Text>
                    </View>
                    <Text style={[styles.activityAmount, { color: iconColor }]}>
                      {amountPrefix}Rp {formatRupiah(trx.amount)}
                    </Text>
                  </View>
                  {/* Jangan tampilkan garis pembatas untuk item terakhir */}
                  {index < recentTransactions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      </View>

      <CustomAlert 
        visible={errorAlert.visible}
        title="Oops!"
        message={errorAlert.message}
        type="error"
        onConfirm={() => setErrorAlert({ visible: false, message: '' })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    padding: 20,
  },
  saldoCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  saldoLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  saldoAmount: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'monospace',
    letterSpacing: -1,
  },
  saldoMembers: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 20,
  },
  rincianButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rincianButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#343a40',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 24,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    color: '#adb5bd',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    paddingRight: 10,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#adb5bd',
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f3f5',
    marginVertical: 14,
  },
});

export default HomeScreen;
