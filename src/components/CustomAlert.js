import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'success' | 'error' | 'info' | 'confirm'
  onConfirm,
  onCancel,
  confirmText = 'Oke',
  cancelText = 'Batal',
}) => {
  const { theme } = useTheme();

  // Menentukan warna dan ikon berdasarkan tipe alert
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return { color: '#2ecc71', icon: 'checkmark-circle' };
      case 'error':
        return { color: '#e74c3c', icon: 'close-circle' };
      case 'confirm':
        return { color: theme.colors.primary, icon: 'help-circle' };
      case 'info':
      default:
        return { color: theme.colors.primary, icon: 'information-circle' };
    }
  };

  const { color: typeColor, icon } = getAlertStyle();

  return (
    <Modal 
      transparent={true} 
      visible={visible} 
      animationType="fade" 
      onRequestClose={type === 'confirm' ? onCancel : onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          
          <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
            <Ionicons name={icon} size={48} color={typeColor} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {type === 'confirm' && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.confirmButton, 
                { backgroundColor: typeColor }
              ]} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  confirmButton: {
    // Background color dinamis berdasarkan tipe alert
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CustomAlert;
