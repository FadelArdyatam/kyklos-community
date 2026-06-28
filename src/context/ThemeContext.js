import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { staticColors, hexToRgba } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#124068');

  // Muat warna dari AsyncStorage saat pertama kali dibuka
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedColor = await AsyncStorage.getItem('primaryColor');
        if (storedColor) {
          setPrimaryColor(storedColor);
        }
      } catch (e) {
        console.error("Gagal memuat warna tema", e);
      }
    };
    loadTheme();
  }, []);

  // Fungsi khusus untuk mengubah warna dan menyimpannya permanen
  const changePrimaryColor = async (color) => {
    setPrimaryColor(color);
    try {
      await AsyncStorage.setItem('primaryColor', color);
    } catch (e) {
      console.error("Gagal menyimpan warna tema", e);
    }
  };

  const theme = {
    colors: {
      ...staticColors,
      primary: primaryColor,
      primaryLight: hexToRgba(primaryColor, 0.15), 
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setPrimaryColor: changePrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
