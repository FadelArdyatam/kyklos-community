import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PrimaryButton = ({ title, onPress, style, iconRight }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }, style]} onPress={onPress}>
      <Text style={[styles.buttonText, iconRight && { marginRight: 8 }]}>{title}</Text>
      {iconRight && <Feather name={iconRight} size={20} color="#fff" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    // backgroundColor will be dynamic
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrimaryButton;
