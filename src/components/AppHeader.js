import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';

const AppHeader = ({ title, onNotificationPress }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { communities, activeCommunity, switchCommunity } = useCommunity();
  const [modalVisible, setModalVisible] = useState(false);

  const avatarSource = user?.avatarUrl 
    ? { uri: user.avatarUrl }
    : { uri: 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&background=random' };

  // Jika activeCommunity ada, gunakan namanya, jika tidak gunakan title bawaan/Kyklos
  const displayTitle = activeCommunity ? activeCommunity.name : (title || "Kyklos");

  const handleSelectCommunity = (community) => {
    switchCommunity(community);
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={avatarSource} style={styles.profilePic} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.titleContainer} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          disabled={!communities || communities.length === 0}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>{displayTitle}</Text>
          {communities && communities.length > 0 && (
            <Feather name="chevron-down" size={18} color={theme.colors.primary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <View style={{ width: 38 }} />
      </View>

      {/* Community Switcher Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Komunitas</Text>
            
            <FlatList
              data={communities}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.communityItem, 
                    activeCommunity?.id === item.id && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                  ]}
                  onPress={() => handleSelectCommunity(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.communityName,
                    activeCommunity?.id === item.id && { color: theme.colors.primary, fontWeight: '700' }
                  ]}>
                    {item.name}
                  </Text>
                  {activeCommunity?.id === item.id && (
                    <Feather name="check-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  communityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f3f5',
    marginBottom: 10,
  },
  communityName: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
});

export default AppHeader;
