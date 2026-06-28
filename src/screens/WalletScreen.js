import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import walletService from '../services/walletService';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

const WalletScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [balance, setBalance] = useState(0);
  const [topups, setTopups] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [topupForm, setTopupForm] = useState({ amount: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });

  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const loadData = async () => {
    try {
      setLoading(true);
      const balRes = await walletService.getBalance();
      const topupsRes = await walletService.getTopups();
      const wdrawsRes = await walletService.getWithdrawals();
      setBalance(balRes.balance || 0);
      setTopups(topupsRes || []);
      setWithdrawals(wdrawsRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTopup = async () => {
    if (!topupForm.amount) return;
    setSubmitting(true);
    try {
      await walletService.topup({ amount: parseFloat(topupForm.amount) });
      setShowTopupModal(false);
      setTopupForm({ amount: '' });
      setAlertConfig({ visible: true, title: 'Berhasil', message: 'Top Up Berhasil disimulasikan.', type: 'success', onConfirm: hideAlert });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Topup gagal', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount) return;
    setSubmitting(true);
    try {
      await walletService.withdraw({
        amount: parseFloat(withdrawForm.amount),
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber,
        accountHolder: withdrawForm.accountHolder
      });
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
      setAlertConfig({ visible: true, title: 'Berhasil', message: 'Permintaan penarikan berhasil dibuat. Menunggu persetujuan admin.', type: 'success', onConfirm: hideAlert });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Penarikan gagal', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Dompet Komunitas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.balanceLabel}>Total Saldo</Text>
            <Text style={styles.balanceValue}>Rp {balance.toLocaleString('id-ID')}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowTopupModal(true)}>
                <Feather name="plus-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowWithdrawModal(true)}>
                <Feather name="arrow-down-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Tarik Dana</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Riwayat Top Up</Text>
          {topups.map((t, idx) => (
            <View key={idx} style={styles.historyCard}>
              <View>
                <Text style={styles.historyTitle}>Top Up</Text>
                <Text style={styles.historyDate}>{new Date(t.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyAmount, { color: '#10b981' }]}>+ Rp {t.amount.toLocaleString('id-ID')}</Text>
                <Text style={styles.historyStatus}>{t.status}</Text>
              </View>
            </View>
          ))}
          {topups.length === 0 && <Text style={styles.emptyText}>Belum ada riwayat top up.</Text>}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Riwayat Penarikan</Text>
          {withdrawals.map((t, idx) => (
            <View key={idx} style={styles.historyCard}>
              <View>
                <Text style={styles.historyTitle}>Tarik ke {t.bankName}</Text>
                <Text style={styles.historyDate}>{t.accountNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyAmount, { color: '#ef4444' }]}>- Rp {t.amount.toLocaleString('id-ID')}</Text>
                <Text style={styles.historyStatus}>{t.status}</Text>
              </View>
            </View>
          ))}
          {withdrawals.length === 0 && <Text style={styles.emptyText}>Belum ada riwayat penarikan.</Text>}
        </ScrollView>
      )}

      {/* Topup Modal */}
      <Modal visible={showTopupModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Saldo</Text>
            <CustomInput keyboardType="numeric" placeholder="Nominal (Rp)" value={topupForm.amount} onChangeText={(text) => setTopupForm(f => ({ ...f, amount: text }))} />
            <View style={{ height: 16 }} />
            <PrimaryButton title="Lanjutkan" onPress={handleTopup} loading={submitting} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTopupModal(false)}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Penarikan Dana</Text>
            <CustomInput keyboardType="numeric" placeholder="Nominal (Rp)" value={withdrawForm.amount} onChangeText={(text) => setWithdrawForm(f => ({ ...f, amount: text }))} />
            <View style={{ height: 12 }} />
            <CustomInput placeholder="Nama Bank" value={withdrawForm.bankName} onChangeText={(text) => setWithdrawForm(f => ({ ...f, bankName: text }))} />
            <View style={{ height: 12 }} />
            <CustomInput keyboardType="numeric" placeholder="Nomor Rekening" value={withdrawForm.accountNumber} onChangeText={(text) => setWithdrawForm(f => ({ ...f, accountNumber: text }))} />
            <View style={{ height: 12 }} />
            <CustomInput placeholder="Atas Nama" value={withdrawForm.accountHolder} onChangeText={(text) => setWithdrawForm(f => ({ ...f, accountHolder: text }))} />
            <View style={{ height: 16 }} />
            <PrimaryButton title="Kirim Permintaan" onPress={handleWithdraw} loading={submitting} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowWithdrawModal(false)}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onConfirm={alertConfig.onConfirm} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  balanceCard: { borderRadius: 16, padding: 24, marginBottom: 24 },
  balanceLabel: { color: '#ffffff', opacity: 0.8, fontSize: 14, marginBottom: 8 },
  balanceValue: { color: '#ffffff', fontSize: 32, fontWeight: '700', marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontWeight: '600', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  historyDate: { fontSize: 13, color: '#6c757d', marginTop: 4 },
  historyAmount: { fontSize: 15, fontWeight: '700' },
  historyStatus: { fontSize: 12, color: '#6c757d', marginTop: 4, textTransform: 'uppercase' },
  emptyText: { color: '#6c757d', fontStyle: 'italic', marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  cancelButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#6c757d', fontWeight: '600' }
});

export default WalletScreen;
