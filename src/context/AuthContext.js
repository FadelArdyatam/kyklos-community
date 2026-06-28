import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Memuat data user dari AsyncStorage saat aplikasi pertama kali dibuka
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('userProfile');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.log("Gagal membaca profil dari cache", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    loadCachedUser();
  }, []);

  // Menyimpan dan memperbarui data user secara global dan ke cache lokal
  const saveUser = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
    } catch (error) {
      console.log("Gagal menyimpan profil ke cache", error);
    }
  };

  // Membersihkan semua data saat keluar (Logout)
  const logoutUser = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('userProfile');
      await SecureStore.deleteItemAsync('accessToken');
    } catch (error) {
      console.log("Gagal membersihkan sesi", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, saveUser, logoutUser, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
