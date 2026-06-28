import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCommunity } from '../context/CommunityContext';
import { useTheme } from '../context/ThemeContext';
import communityService from '../services/communityService';

const CommunitySelectionScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { switchCommunity, setCommunities, communities } = useCommunity();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const data = await communityService.getCommunities();
        setCommunities(data); // Simpan ke context
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    loadCommunities();
  }, []);

  const handleSelectCommunity = async (community) => {
    await switchCommunity(community);
    navigation.replace('Main');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilih Komunitas</Text>
        <Text style={styles.headerSubtitle}>
          Pilih komunitas yang ingin kamu akses
        </Text>
      </View>

      {communities && communities.length > 0 ? (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleSelectCommunity(item)}
            >
              <View style={styles.cardContent}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={styles.logo} />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: item.themeColor || theme.colors.primary }]}>
                    <Text style={styles.logoText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.infoContainer}>
                  <Text style={styles.communityName}>{item.name}</Text>
                  <Text style={styles.memberCount}>
                    {item._count?.memberships || 0} Anggota
                  </Text>
                </View>
                <Feather name="chevron-right" size={24} color="#adb5bd" />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="folder-minus" size={64} color="#dee2e6" style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>Belum Ada Komunitas</Text>
          <Text style={styles.emptySub}>Kamu belum bergabung dengan komunitas apapun.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f3f5',
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 13,
    color: '#868e96',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#868e96',
    textAlign: 'center',
  },
});

export default CommunitySelectionScreen;
