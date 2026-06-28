import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import communityService from '../services/communityService';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const CommunityContext = createContext();

export const CommunityProvider = ({ children }) => {
  const { user } = useAuth();
  const { setPrimaryColor } = useTheme();
  
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Fungsi untuk mengganti komunitas yang aktif secara instan
  const switchCommunity = async (community) => {
    setActiveCommunity(community);
    await AsyncStorage.setItem('activeCommunityId', community.id);
    
    // Ganti warna seluruh aplikasi
    if (community.themeColor) {
      setPrimaryColor(community.themeColor);
    }
  };

  return (
    <CommunityContext.Provider value={{ 
      communities, 
      setCommunities,
      activeCommunity, 
      isLoadingCommunity, 
      switchCommunity,
    }}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => useContext(CommunityContext);
