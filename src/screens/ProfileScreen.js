import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import CustomAlert from '../components/CustomAlert';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';

const SettingsItem = ({ icon, title, isLast, IconComponent = Feather, onPress }) => (
  <>
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <IconComponent name={icon} size={20} color="#343a40" style={styles.settingsItemIcon} />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#adb5bd" />
    </TouchableOpacity>
    {!isLast && <View style={styles.divider} />}
  </>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, saveUser, logoutUser } = useAuth(); // Pakai Global Context
  const { activeCommunity } = useCommunity();

  // State Profile
  const [isFetching, setIsFetching] = useState(true);

  // State Edit Profile Modal
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Alert Config
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Ambil Data Profil Saat Layar Dibuka
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      const data = await authService.getProfile();
      saveUser(data); // Simpan ke Global & AsyncStorage
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Gagal memuat profil. Sesi mungkin telah berakhir.',
        type: 'error',
        onConfirm: () => {
          hideAlert();
          handleLogout();
        }
      });
    } finally {
      setIsFetching(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditName(user.name || '');
      setEditAvatarUrl(user.avatarUrl || '');
    }
    setIsEditVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editName) {
      setAlertConfig({ visible: true, title: 'Perhatian', message: 'Nama tidak boleh kosong', type: 'error', onConfirm: hideAlert });
      return;
    }
    
    setIsUpdating(true);
    try {
      const payload = {
        name: editName,
        avatarUrl: editAvatarUrl || null,
      };
      const updatedData = await authService.updateProfile(payload);
      saveUser(updatedData); // Update Global & AsyncStorage
      setIsEditVisible(false);
      
      setAlertConfig({
        visible: true,
        title: 'Sukses',
        message: 'Profil berhasil diperbarui.',
        type: 'success',
        onConfirm: hideAlert
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil.',
        type: 'error',
        onConfirm: hideAlert
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser(); // Hapus Token & Cache dari Context
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const confirmLogout = () => {
    setAlertConfig({
      visible: true,
      title: 'Keluar',
      message: 'Apakah kamu yakin ingin keluar dari aplikasi Kyklos?',
      type: 'confirm',
      onConfirm: () => {
        hideAlert();
        handleLogout();
      },
      onCancel: hideAlert
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Profil</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          {isFetching && !user ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 30 }} />
          ) : (
            <>
              <Image
                source={{ uri: user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&background=random' }}
                style={styles.profileImage}
              />
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={[styles.memberBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Feather name="calendar" size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.memberBadgeText, { color: theme.colors.primary }]}>
                  Bergabung {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Feather name="shield" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>Anggota Aktif</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Feather name="home" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>KOMUNITAS</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]} numberOfLines={1}>
                {activeCommunity?.name || 'Belum ada'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsCategory}>AKUN</Text>
          <SettingsItem icon="user" title="Edit Profil" onPress={openEditModal} isLast={true} />
          
          <View style={styles.categoryDivider} />

          <Text style={styles.settingsCategory}>TAMPILAN</Text>
          <SettingsItem 
            icon="color-palette-outline" 
            title="Tema & Warna" 
            isLast={true} 
            IconComponent={Ionicons}
            onPress={() => navigation.navigate('Theme')}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Feather name="log-out" size={18} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Kyklos App v2.1.0</Text>

      </ScrollView>
      </View>

      {/* Modal Edit Profil */}
      <Modal visible={isEditVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setIsEditVisible(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
            </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
                <CustomInput 
                  iconName="user"
                  placeholder="Nama Anda"
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL AVATAR (Opsional)</Text>
                <CustomInput 
                  iconName="image"
                  placeholder="https://..."
                  value={editAvatarUrl}
                  onChangeText={setEditAvatarUrl}
                  autoCapitalize="none"
                />
              </View>

              <PrimaryButton 
                title={isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
                style={{ marginTop: 10 }}
              />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
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
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e9ecef',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 24,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  settingsCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 0.5,
    marginLeft: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemIcon: {
    marginRight: 15,
  },
  settingsItemText: {
    fontSize: 15,
    color: '#343a40',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 55,
  },
  categoryDivider: {
    height: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fceaea',
    borderWidth: 1,
    borderColor: '#f5c2c7',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 12,
  },
  // Modal Edit Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
