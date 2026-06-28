import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import * as SecureStore from 'expo-secure-store';

const VerifyOtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // Menangkap parameter email dari RegisterScreen
  const email = route.params?.email || "email@example.com";

  // State untuk 6 digit OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
  const inputRefs = useRef([]);

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Logika saat kotak OTP diketik
  const handleOtpChange = (value, index) => {
    // Hanya izinkan angka
    const numericValue = value.replace(/[^0-9]/g, '');
    
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Pindah ke kotak berikutnya jika diisi
    if (numericValue && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Logika untuk menghapus (backspace) dan kembali ke kotak sebelumnya
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Fungsi Eksekusi API
  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length < 6) {
      setAlertConfig({
        visible: true,
        title: 'Perhatian',
        message: 'Harap masukkan 6 digit kode OTP.',
        type: 'error',
        onConfirm: hideAlert
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email: email, 
        otp: otpCode
      };

      const response = await authService.verifyOtp(payload);

      // Jika berhasil, simpan Token
      if (response.accessToken) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        
        setAlertConfig({
          visible: true,
          title: 'Berhasil',
          message: 'Akun berhasil diverifikasi!',
          type: 'success',
          onConfirm: () => {
            hideAlert();
            navigation.navigate('Main'); // Arahkan ke Halaman Utama
          }
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Kode OTP salah atau kedaluwarsa.';
      setAlertConfig({
        visible: true,
        title: 'Gagal',
        message: errorMsg,
        type: 'error',
        onConfirm: hideAlert
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="mail-open-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Verifikasi OTP</Text>
            <Text style={styles.subtitle}>
              Masukkan 6 digit kode yang telah kami kirimkan ke email {'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formCard}>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => inputRefs.current[index] = ref}
                  style={[
                    styles.otpInput,
                    { 
                      borderColor: digit ? theme.colors.primary : '#e9ecef',
                      backgroundColor: digit ? theme.colors.primaryLight : '#f8f9fa'
                    }
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <PrimaryButton 
              title={isLoading ? "Memverifikasi..." : "Verifikasi"}
              onPress={handleVerify}
              disabled={isLoading || otp.join('').length < 6}
              style={styles.verifyBtn}
            />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Belum menerima kode? </Text>
              <TouchableOpacity onPress={() => {
                setAlertConfig({
                  visible: true,
                  title: 'Kirim Ulang OTP',
                  message: 'Apakah kamu yakin ingin mengirim ulang kode OTP ke email ini?',
                  type: 'confirm',
                  onConfirm: () => {
                    hideAlert();
                    // panggil fungsi authService.resendOtp(email) di sini nantinya
                  },
                  onCancel: hideAlert
                });
              }}>
                <Text style={[styles.resendTextBold, { color: theme.colors.primary }]}>Kirim Ulang</Text>
              </TouchableOpacity>
            </View>

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
    flexGrow: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    zIndex: 10,
  },
  headerContent: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
  emailText: {
    fontWeight: '700', 
    color: '#111'
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
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  verifyBtn: { width: '100%', marginTop: 10 },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  resendText: { color: '#6c757d', fontSize: 14 },
  resendTextBold: { fontSize: 14, fontWeight: '700' },
});

export default VerifyOtpScreen;
