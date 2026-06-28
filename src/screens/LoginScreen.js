import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import CustomInput from '../components/CustomInput';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import * as SecureStore from 'expo-secure-store';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertConfig({
        visible: true,
        title: 'Perhatian',
        message: 'Email dan kata sandi wajib diisi!',
        type: 'error',
        onConfirm: hideAlert
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { email, password };
      const response = await authService.login(payload);

      if (response.accessToken) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        
        // (Opsional) Simpan response.user ke state management di sini jika ada
        
        navigation.navigate('CommunitySelection');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Email atau kata sandi salah.';
      setAlertConfig({
        visible: true,
        title: 'Gagal Masuk',
        message: errorMsg,
        type: 'error',
        onConfirm: hideAlert
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="wallet-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>
              Masuk ke akun Kyklos Anda untuk mulai mengelola keuangan komunitas.
            </Text>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <CustomInput 
                iconName="at-sign"
                placeholder="nama@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>KATA SANDI</Text>
                <TouchableOpacity>
                  <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Lupa Password?</Text>
                </TouchableOpacity>
              </View>
              <CustomInput 
                iconName="lock"
                placeholder="••••••••"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <PrimaryButton 
              title={isLoading ? "Memproses..." : "Masuk"} 
              onPress={handleLogin} 
              disabled={isLoading}
              style={styles.loginBtn}
            />



          </View>

          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerLinkText}>Belum memiliki akun? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={[styles.registerLinkTextBold, { color: theme.colors.primary }]}>Daftar Sekarang</Text>
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
    marginBottom: 40,
    marginTop: 20,
  },
  headerContent: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 12 },
  subtitle: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#343a40',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    // color dynamic
    marginBottom: 8,
  },
  loginBtn: { marginTop: 10 },
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
  registerLinkContainer: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 20,
  },
  registerLinkText: { color: '#6c757d', fontSize: 15 },
  registerLinkTextBold: { fontSize: 15, fontWeight: '700' },
});

export default LoginScreen;
