import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const [form, setForm] = useState({
    method: 'manual_transfer',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    gatewayProvider: 'midtrans',
    serverKey: '',
    clientKey: '',
  });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const fetchConfig = async () => {
      if (!activeCommunity?.id) return;
      try {
        setLoading(true);
        const config = await communityService.getPaymentConfig(activeCommunity.id);
        if (config) {
          setForm(prev => ({
            ...prev,
            ...config
          }));
        }
      } catch (error) {
        console.error("Failed to load payment config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [activeCommunity?.id]);

  const handleSave = async () => {
    if (!activeCommunity?.id) return;
    
    setSaving(true);
    try {
      await communityService.updatePaymentConfig(activeCommunity.id, form);
      setAlertConfig({
        visible: true,
        title: 'Berhasil',
        message: 'Pengaturan pembayaran berhasil disimpan.',
        type: 'success',
        onConfirm: () => {
            hideAlert();
            navigation.goBack();
        }
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Gagal',
        message: 'Terjadi kesalahan saat menyimpan pengaturan.',
        type: 'error',
        onConfirm: hideAlert
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Pengaturan Pembayaran</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Rekening Komunitas</Text>
              <Text style={styles.sectionSubtitle}>Informasi ini akan digunakan oleh anggota untuk melakukan transfer manual iuran dan kas.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAMA BANK</Text>
                <CustomInput 
                  iconName="credit-card"
                  placeholder="BCA, Mandiri, BRI, dll"
                  value={form.bankName}
                  onChangeText={(text) => setForm(f => ({...f, bankName: text}))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOMOR REKENING</Text>
                <CustomInput 
                  iconName="hash"
                  placeholder="Contoh: 1234567890"
                  value={form.accountNumber}
                  keyboardType="numeric"
                  onChangeText={(text) => setForm(f => ({...f, accountNumber: text}))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAMA PEMILIK REKENING</Text>
                <CustomInput 
                  iconName="user"
                  placeholder="Contoh: Budi Santoso"
                  value={form.accountHolder}
                  onChangeText={(text) => setForm(f => ({...f, accountHolder: text}))}
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Payment Gateway (Midtrans)</Text>
              <Text style={styles.sectionSubtitle}>Untuk menerima pembayaran instan via Virtual Account atau e-Wallet. (Opsional)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CLIENT KEY</Text>
                <CustomInput 
                  iconName="key"
                  placeholder="Midtrans Client Key"
                  value={form.clientKey}
                  onChangeText={(text) => setForm(f => ({...f, clientKey: text}))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SERVER KEY</Text>
                <CustomInput 
                  iconName="key"
                  placeholder="Midtrans Server Key"
                  value={form.serverKey}
                  secureTextEntry
                  onChangeText={(text) => setForm(f => ({...f, serverKey: text}))}
                />
              </View>

              <View style={{ marginTop: 20 }}>
                <PrimaryButton 
                    title="Simpan Pengaturan" 
                    onPress={handleSave}
                    loading={saving}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 24,
  },
});

export default SettingsScreen;
