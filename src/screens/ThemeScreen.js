import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  { name: 'Ocean Blue', hex: '#124068' },
  { name: 'Emerald', hex: '#2e7d32' },
  { name: 'Crimson', hex: '#c62828' },
  { name: 'Amethyst', hex: '#6a1b9a' },
  { name: 'Sunset', hex: '#e65100' },
  { name: 'Teal', hex: '#00695c' },
  { name: 'Rose', hex: '#c2185b' },
  { name: 'Midnight', hex: '#212529' },
];

const ThemeScreen = () => {
  const navigation = useNavigation();
  const { theme, setPrimaryColor } = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Theme & Branding</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Pilih Warna Utama</Text>
        <Text style={styles.sectionSubtitle}>
          Ubah warna utama aplikasi sesuai dengan selera Anda. Perubahan akan langsung diterapkan ke seluruh aplikasi.
        </Text>

        <View style={styles.gridContainer}>
          {COLORS.map((item) => {
            const isSelected = theme.colors.primary === item.hex;

            return (
              <TouchableOpacity
                key={item.hex}
                style={[
                  styles.colorCard,
                  isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setPrimaryColor(item.hex)}
              >
                <View style={[styles.colorCircle, { backgroundColor: item.hex }]} />
                <Text style={[styles.colorName, isSelected && { fontWeight: '700', color: theme.colors.primary }]}>
                  {item.name}
                </Text>
                {isSelected && (
                  <Feather name="check-circle" size={18} color={theme.colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
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
    backgroundColor: '#f8f9fa',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  colorName: {
    fontSize: 14,
    color: '#343a40',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default ThemeScreen;
