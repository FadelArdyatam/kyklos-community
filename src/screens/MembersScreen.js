import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

const MembersScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const loadData = async () => {
    if (!activeCommunity?.id) return;
    try {
      setLoading(true);
      const data = await communityService.getMembers(activeCommunity.id);
      setMembers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeCommunity?.id]);

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setSubmitting(true);
    try {
      await communityService.addMember(activeCommunity.id, inviteForm);
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'member' });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Gagal', message: 'Gagal menambahkan anggota. Pastikan email terdaftar.', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (membershipId) => {
    setAlertConfig({
      visible: true,
      title: 'Hapus Anggota',
      message: 'Yakin ingin menghapus anggota ini?',
      type: 'warning',
      onConfirm: async () => {
        hideAlert();
        try {
          await communityService.removeMember(activeCommunity.id, membershipId);
          loadData();
        } catch (e) {
          setTimeout(() => {
            setAlertConfig({ visible: true, title: 'Error', message: 'Gagal menghapus', type: 'error', onConfirm: hideAlert });
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
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Daftar Anggota</Text>
        <TouchableOpacity onPress={() => setShowInviteModal(true)}>
          <Feather name="user-plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              <View style={styles.memberInfoRow}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>{item.user?.name?.[0] || '?'}</Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{item.user?.name}</Text>
                  <Text style={styles.memberEmail}>{item.user?.email}</Text>
                  <Text style={styles.memberRole}>{item.role}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)}>
                <Feather name="trash-2" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada anggota.</Text>}
        />
      )}

      <Modal visible={showInviteModal} transparent={true} animationType="fade" onRequestClose={() => setShowInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Anggota</Text>
            <CustomInput placeholder="Email pengguna..." value={inviteForm.email} onChangeText={(text) => setInviteForm(f => ({ ...f, email: text }))} />
            <View style={{ height: 16 }} />
            <PrimaryButton title="Undang" onPress={handleInvite} loading={submitting} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInviteModal(false)}>
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
  listContainer: { padding: 20 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e9ecef' },
  memberInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitial: { fontSize: 18, fontWeight: 'bold' },
  memberDetails: { justifyContent: 'center' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#212529' },
  memberEmail: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  memberRole: { fontSize: 12, color: '#495057', marginTop: 4, fontWeight: '500', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#6c757d', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  cancelButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#6c757d', fontWeight: '600' }
});

export default MembersScreen;
