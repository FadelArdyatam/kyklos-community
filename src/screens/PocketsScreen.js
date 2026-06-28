import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import pocketService from '../services/pocketService';
import { useCurrency } from '../hooks/useCurrency';

const PocketsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();
  
  const { formatRupiah } = useCurrency();

  const [activeTab, setActiveTab] = useState('bukuKas'); // 'statusIuran' | 'bukuKas'
  const [pockets, setPockets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  
  const [dues, setDues] = useState([]);
  const [loadingDues, setLoadingDues] = useState(false);

  const [selectedPocket, setSelectedPocket] = useState(null);
  const [selectedPocketTxns, setSelectedPocketTxns] = useState([]);
  const [loadingSelectedTxns, setLoadingSelectedTxns] = useState(false);

  const mainPocket = pockets.find(p => p.type === 'KAS' || p.name === 'KAS KOMUNITAS');

  useEffect(() => {
    const fetchSelectedPocketTxns = async () => {
      if (!selectedPocket) return;
      try {
        setLoadingSelectedTxns(true);
        const response = await pocketService.getTransactions(selectedPocket.id);
        setSelectedPocketTxns(response.data || []);
      } catch (error) {
        console.error("Error fetching pocket transactions:", error);
      } finally {
        setLoadingSelectedTxns(false);
      }
    };
    fetchSelectedPocketTxns();
  }, [selectedPocket]);

  useEffect(() => {
    const fetchDues = async () => {
      if (!activeCommunity?.id) return;
      try {
        setLoadingDues(true);
        const data = await communityService.getDues(activeCommunity.id);
        setDues(data || []);
      } catch (error) {
        console.error("Error fetching dues:", error);
      } finally {
        setLoadingDues(false);
      }
    };
    
    if (activeTab === 'statusIuran') {
      fetchDues();
    }
  }, [activeCommunity?.id, activeTab]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!mainPocket?.id) return;
      try {
        setLoadingTx(true);
        const response = await pocketService.getTransactions(mainPocket.id);
        setTransactions(response.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoadingTx(false);
      }
    };
    
    if (activeTab === 'bukuKas' && mainPocket?.id) {
      fetchTransactions();
    }
  }, [mainPocket?.id, activeTab]);

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'BARU SAJA';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} MENIT LALU`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} JAM LALU`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} HARI LALU`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} BULAN LALU`;
    return `${Math.floor(diffInMonths / 12)} TAHUN LALU`;
  };

  useEffect(() => {
    const fetchPockets = async () => {
      if (!activeCommunity?.id) return;
      try {
        setLoading(true);
        const data = await communityService.getPockets(activeCommunity.id);
        setPockets(data);
      } catch (error) {
        console.error("Error fetching pockets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPockets();
  }, [activeCommunity?.id]);

  const totalBalance = pockets.reduce((sum, pocket) => sum + Number(pocket.balance || 0), 0);

  const getPocketVA = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash).toString().padEnd(8, '7').slice(0, 8);
    return `8802-${val.slice(0, 4)}-${val.slice(4, 8)}`;
  };

  const getPocketVAName = (cName, pName) => {
    const cleanCommunity = (cName || '').slice(0, 15).toUpperCase();
    const cleanPocket = (pName || '').slice(0, 10).toUpperCase();
    return `KYK*${cleanCommunity}*${cleanPocket}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Total Saldo Card */}
        <View style={[styles.totalSaldoCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.totalSaldoLabel}>TOTAL SALDO KOMUNITAS</Text>
          <Text style={styles.totalSaldoAmount}>{loading ? '...' : formatRupiah(totalBalance)}</Text>
        </View>

        {/* Rincian Kas */}
        <View style={styles.rincianContainer}>
          <View style={styles.rincianHeader}>
            <Text style={styles.rincianTitle}>Rincian Kas</Text>
          </View>
          <View style={styles.rincianGrid}>
            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
            ) : pockets.length > 0 ? (
              pockets.map((pocket, index) => (
                <View 
                  key={pocket.id}
                  style={[
                    styles.rincianItem, 
                    { 
                      borderRightWidth: index % 2 === 0 ? 1 : 0, 
                      borderBottomWidth: Math.floor(index / 2) < Math.ceil(pockets.length / 2) - 1 ? 1 : 0
                    }
                  ]}
                >
                  <Text style={styles.rincianItemCategory}>{pocket.type}</Text>
                  <Text style={styles.rincianItemTitle}>{pocket.name}</Text>
                  <Text style={styles.rincianItemAmount}>{formatRupiah(pocket.balance)}</Text>
                  
                  <View style={styles.vaContainer}>
                    <Text style={styles.vaLabel}>Virtual Account Nobu</Text>
                    <Text style={styles.vaNumber}>{getPocketVA(pocket.id)}</Text>
                    <Text style={styles.vaName} numberOfLines={1}>{getPocketVAName(activeCommunity?.name, pocket.name)}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedPocket(pocket)}>
                    <Text style={[styles.rincianItemLink, { color: theme.colors.primary }]}>Lihat Detail & Riwayat</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ padding: 20, color: '#6c757d' }}>Belum ada data kas.</Text>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'statusIuran' && styles.activeTab]} 
            onPress={() => setActiveTab('statusIuran')}
          >
            <Text style={[styles.tabText, activeTab === 'statusIuran' && styles.activeTabText]}>Status Iuran</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bukuKas' && styles.activeTab]} 
            onPress={() => setActiveTab('bukuKas')}
          >
            <Text style={[styles.tabText, activeTab === 'bukuKas' && styles.activeTabText]}>Buku Kas</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'bukuKas' ? (
          <View style={styles.ledgerContainer}>
            <View style={styles.ledgerHeader}>
              <Text style={styles.ledgerTitle}>Buku Kas Utama</Text>
              <Text style={styles.ledgerSubtitle}>Catatan riwayat transaksi yang tidak bisa dihapus.</Text>
            </View>
            
            <View style={styles.ledgerDivider} />
            
            {loadingTx ? (
              <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
            ) : transactions.length > 0 ? (
              transactions.map((txn, index) => (
                <View key={txn.id || index}>
                  <TouchableOpacity style={styles.transactionRow}>
                    <View style={txn.direction === 'out' ? styles.iconOutContainer : styles.iconInContainer}>
                      <Feather 
                        name={txn.direction === 'out' ? "arrow-up" : "arrow-down"} 
                        size={18} 
                        color={txn.direction === 'out' ? "#e03131" : "#00b873"} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{txn.note || txn.category}</Text>
                      <Text style={styles.transactionSubtitle}>
                        {(mainPocket?.name || 'KAS UTAMA').toUpperCase()} • {timeAgo(txn.createdAt)}
                      </Text>
                    </View>
                    <Text style={txn.direction === 'out' ? styles.transactionAmountOut : styles.transactionAmountIn}>
                      {txn.direction === 'out' ? '-' : '+'}{formatRupiah(txn.amount)}
                    </Text>
                  </TouchableOpacity>
                  {index < transactions.length - 1 && <View style={styles.ledgerDivider} />}
                </View>
              ))
            ) : (
              <Text style={{ padding: 20, color: '#6c757d', textAlign: 'center' }}>Belum ada transaksi.</Text>
            )}
          </View>
        ) : (
          <View style={styles.ledgerContainer}>
            <View style={styles.ledgerHeader}>
              <Text style={styles.ledgerTitle}>Status Iuran & Tagihan</Text>
              <Text style={styles.ledgerSubtitle}>Jadwal iuran yang perlu dibayarkan oleh anggota.</Text>
            </View>
            
            <View style={styles.ledgerDivider} />
            
            {loadingDues ? (
              <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
            ) : dues.length > 0 ? (
              dues.map((due, index) => (
                <View key={due.id || index}>
                  <TouchableOpacity style={styles.transactionRow}>
                    <View style={[styles.iconInContainer, { backgroundColor: '#eef3f7' }]}>
                      <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{due.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View style={{ backgroundColor: '#f1f3f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                          <Text style={{ fontSize: 10, color: '#495057', fontWeight: '700', textTransform: 'uppercase' }}>
                            {due.period === 'monthly' ? 'Bulanan' : due.period === 'weekly' ? 'Mingguan' : due.period === 'yearly' ? 'Tahunan' : due.period}
                          </Text>
                        </View>
                        <Text style={[styles.transactionSubtitle, { marginTop: 0 }]}>
                          Jatuh Tempo: {new Date(due.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.transactionAmountOut, { color: '#111' }]}>
                      {formatRupiah(due.amount)}
                    </Text>
                  </TouchableOpacity>
                  {index < dues.length - 1 && <View style={styles.ledgerDivider} />}
                </View>
              ))
            ) : (
              <Text style={{ padding: 20, color: '#6c757d', textAlign: 'center' }}>Belum ada jadwal iuran.</Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </View>

      {/* Pocket Detail Modal */}
      <Modal
        visible={!!selectedPocket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPocket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPocket?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPocket(null)}>
                <Ionicons name="close" size={24} color="#495057" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Wallet Info */}
              <View style={[styles.rincianItem, { borderRightWidth: 0, borderBottomWidth: 0, paddingHorizontal: 0, paddingTop: 0 }]}>
                <Text style={styles.rincianItemCategory}>{selectedPocket?.type}</Text>
                <Text style={styles.rincianItemAmount}>{formatRupiah(selectedPocket?.balance)}</Text>
                
                <View style={styles.vaContainer}>
                  <Text style={styles.vaLabel}>Virtual Account Nobu</Text>
                  <Text style={styles.vaNumber}>{selectedPocket ? getPocketVA(selectedPocket.id) : ''}</Text>
                  <Text style={styles.vaName} numberOfLines={1}>{selectedPocket ? getPocketVAName(activeCommunity?.name, selectedPocket.name) : ''}</Text>
                </View>
              </View>
              
              <View style={styles.ledgerDivider} />
              <Text style={[styles.ledgerTitle, { marginBottom: 15, marginTop: 10 }]}>Riwayat Transaksi</Text>
              
              {loadingSelectedTxns ? (
                <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
              ) : selectedPocketTxns.length > 0 ? (
                selectedPocketTxns.map((txn, index) => (
                  <View key={txn.id || index}>
                    <TouchableOpacity style={styles.transactionRow}>
                      <View style={txn.direction === 'out' ? styles.iconOutContainer : styles.iconInContainer}>
                        <Feather 
                          name={txn.direction === 'out' ? "arrow-up" : "arrow-down"} 
                          size={18} 
                          color={txn.direction === 'out' ? "#e03131" : "#00b873"} 
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>{txn.note || txn.category}</Text>
                        <Text style={styles.transactionSubtitle}>
                          {timeAgo(txn.createdAt)}
                        </Text>
                      </View>
                      <Text style={txn.direction === 'out' ? styles.transactionAmountOut : styles.transactionAmountIn}>
                        {txn.direction === 'out' ? '-' : '+'}{formatRupiah(txn.amount)}
                      </Text>
                    </TouchableOpacity>
                    {index < selectedPocketTxns.length - 1 && <View style={styles.ledgerDivider} />}
                  </View>
                ))
              ) : (
                <Text style={{ padding: 20, color: '#6c757d', textAlign: 'center' }}>Belum ada riwayat transaksi.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    // color dynamic
  },
  scrollContainer: {
    padding: 20,
  },
  totalSaldoCard: {
    borderRadius: 16,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  totalSaldoLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  totalSaldoAmount: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  liveSyncText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  rincianContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    overflow: 'hidden',
  },
  rincianHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  rincianTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  rincianGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rincianItem: {
    width: '50%',
    padding: 16,
    borderColor: '#e9ecef',
  },
  rincianItemCategory: {
    fontSize: 10,
    color: '#868e96',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rincianItemTitle: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 8,
  },
  rincianItemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  rincianItemLink: {
    fontSize: 11,
    fontWeight: '600',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#868e96',
  },
  activeTabText: {
    color: '#111',
  },

  ledgerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  ledgerHeader: {
    padding: 20,
  },
  ledgerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  ledgerSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  ledgerDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  iconInContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconOutContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffe3e3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  transactionSubtitle: {
    fontSize: 11,
    color: '#868e96',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  transactionAmountIn: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00b873',
  },
  transactionAmountOut: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  statusContainer: {
    padding: 40,
    alignItems: 'center',
  },
  statusText: {
    color: '#6c757d',
    fontSize: 14,
  },
  vaContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  vaLabel: {
    fontSize: 8,
    color: '#adb5bd',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  vaNumber: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vaName: {
    fontSize: 9,
    color: '#ced4da',
    fontWeight: '600',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
});

export default PocketsScreen;
