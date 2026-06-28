import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

const ContributionsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();
  
  const [dues, setDues] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewDueModal, setShowNewDueModal] = useState(false);
  const [dueForm, setDueForm] = useState({ title: '', amount: '', dueDate: '', frequency: 'monthly' });
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const loadData = async () => {
    if (!activeCommunity?.id) return;
    try {
      setLoading(true);
      const [fetchedDues, fetchedContribs] = await Promise.all([
        communityService.getDues(activeCommunity.id),
        communityService.getContributions(activeCommunity.id)
      ]);
      setDues(fetchedDues || []);
      setContributions(fetchedContribs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeCommunity?.id]);

  const handleCreateDue = async () => {
    if (!dueForm.title || !dueForm.amount) return;
    setSubmitting(true);
    try {
      await communityService.createDue(activeCommunity.id, {
        ...dueForm,
        amount: parseFloat(dueForm.amount),
        dueDate: dueForm.dueDate || new Date().toISOString(),
      });
      setShowNewDueModal(false);
      setDueForm({ title: '', amount: '', dueDate: '', frequency: 'monthly' });
      setAlertConfig({ visible: true, title: 'Berhasil', message: 'Tagihan iuran berhasil dibuat', type: 'success', onConfirm: hideAlert });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Gagal membuat tagihan', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = (id) => {
    setAlertConfig({
      visible: true, title: 'Generate Tagihan', message: 'Generate tagihan ini untuk semua anggota aktif?', type: 'info',
      onConfirm: async () => {
        hideAlert();
        try {
          await communityService.generateDue(id);
          setTimeout(() => {
            setAlertConfig({ visible: true, title: 'Berhasil', message: 'Tagihan di-generate.', type: 'success', onConfirm: hideAlert });
          }, 500);
          loadData();
        } catch (e) {
          setTimeout(() => {
            setAlertConfig({ visible: true, title: 'Error', message: 'Gagal generate', type: 'error', onConfirm: hideAlert });
          }, 500);
        }
      }
    });
  };

  const handleVerify = (id) => {
    setAlertConfig({
      visible: true, title: 'Verifikasi Pembayaran', message: 'Verifikasi pembayaran ini?', type: 'info',
      onConfirm: async () => {
        hideAlert();
        try {
          await communityService.verifyContribution(id);
          setTimeout(() => {
            setAlertConfig({ visible: true, title: 'Berhasil', message: 'Pembayaran diverifikasi.', type: 'success', onConfirm: hideAlert });
          }, 500);
          loadData();
        } catch (e) {
          setTimeout(() => {
            setAlertConfig({ visible: true, title: 'Error', message: 'Gagal verifikasi', type: 'error', onConfirm: hideAlert });
          }, 500);
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Manajemen Iuran</Text>
        <TouchableOpacity onPress={() => setShowNewDueModal(true)}>
          <Feather name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>Jadwal Iuran (Admin)</Text>
          {dues.map((d, idx) => (
            <View key={idx} style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>{d.title}</Text>
                <Text style={styles.cardSubtitle}>Rp {Number(d.amount).toLocaleString('id-ID')} • {d.frequency}</Text>
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]} onPress={() => handleGenerate(d.id)}>
                <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Generate</Text>
              </TouchableOpacity>
            </View>
          ))}
          {dues.length === 0 && <Text style={styles.emptyText}>Belum ada jadwal iuran.</Text>}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Menunggu Verifikasi</Text>
          {contributions.filter(c => c.status === 'pending').map((c, idx) => (
            <View key={idx} style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>{c.member?.name}</Text>
                <Text style={styles.cardSubtitle}>{c.schedule?.title} • Rp {Number(c.amount).toLocaleString('id-ID')}</Text>
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleVerify(c.id)}>
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Verifikasi</Text>
              </TouchableOpacity>
            </View>
          ))}
          {contributions.filter(c => c.status === 'pending').length === 0 && <Text style={styles.emptyText}>Tidak ada pembayaran pending.</Text>}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={showNewDueModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Jadwal Iuran Baru</Text>
            <CustomInput placeholder="Judul (Misal: Iuran Kas)" value={dueForm.title} onChangeText={t => setDueForm(f => ({ ...f, title: t }))} />
            <View style={{ height: 12 }} />
            <CustomInput keyboardType="numeric" placeholder="Nominal (Rp)" value={dueForm.amount} onChangeText={t => setDueForm(f => ({ ...f, amount: t }))} />
            <View style={{ height: 12 }} />
            <CustomInput placeholder="YYYY-MM-DD" value={dueForm.dueDate} onChangeText={t => setDueForm(f => ({ ...f, dueDate: t }))} />
            <View style={{ height: 16 }} />
            <PrimaryButton title="Buat Jadwal" onPress={handleCreateDue} loading={submitting} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewDueModal(false)}>
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
  scrollContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardSubtitle: { fontSize: 13, color: '#6c757d', marginTop: 4 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { fontWeight: '600', fontSize: 13 },
  emptyText: { color: '#6c757d', fontStyle: 'italic', marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  cancelButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#6c757d', fontWeight: '600' }
});

export default ContributionsScreen;
