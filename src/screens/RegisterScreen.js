import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import CustomInput from '../components/CustomInput';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setAlertConfig({
        visible: true,
        title: 'Perhatian',
        message: 'Semua kolom wajib diisi!',
        type: 'error',
        onConfirm: hideAlert
      });
      return;
    }

    setLoading(true)

    try {
      const payload = {
        name: name,
        email: email,
        password: password
      }

      const res = await authService.register(payload)

      if (res.requireOtp) {
        setAlertConfig({
          visible: true,
          title: 'Berhasil',
          message: res.message,
          type: 'success',
          onConfirm: () => {
            hideAlert();
            navigation.navigate("VerifyOtp", { email: res.email });
          }
        });
      } else {
        navigation.navigate("Main")
      }
    } catch (error) { 
      const errorMsg =
        error.response?.data?.message ||
        'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.';

      setAlertConfig({
        visible: true,
        title: 'Gagal Daftar',
        message: errorMsg,
        type: 'error',
        onConfirm: hideAlert
      });
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>Kyklos</Text>

          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="wallet-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>
              Mulai langkah finansial komunitas yang transparan dan terpercaya bersama Kyklos.
            </Text>
          </View>

          <View style={styles.formCard}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
              <CustomInput 
                iconName="user"
                placeholder="Masukkan nama"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <CustomInput 
                iconName="mail"
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <CustomInput 
                iconName="lock"
                placeholder="••••••••"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <PrimaryButton 
              title={ isLoading ? "Memproses..." : "Daftar Sekarang" }
              onPress={handleRegister}
              iconRight={ isLoading ? undefined : "arrow-right" }
              style={styles.registerBtn}
              disabled={isLoading}
            />



          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={[styles.loginLinkTextBold, { color: theme.colors.primary }]}>Masuk</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  keyboardView: { flex: 1 },
  scrollContainer: {
    padding: 24,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    // color dynamic
    marginBottom: 30,
    marginTop: 20,
  },
  headerContent: { alignItems: 'center', marginBottom: 30 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 10 },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  registerBtn: { marginTop: 10 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e9ecef' },
  dividerText: {
    marginHorizontal: 15,
    color: '#6c757d',
    fontSize: 13,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 20,
  },
  loginLinkText: { color: '#6c757d', fontSize: 15 },
  loginLinkTextBold: { fontSize: 15, fontWeight: '700' },
});

export default RegisterScreen;
