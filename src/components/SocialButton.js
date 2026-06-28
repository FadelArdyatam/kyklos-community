import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';

const SocialButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.googleButton} onPress={onPress}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
        style={styles.googleIcon} 
      />
      <Text style={styles.googleButtonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
});

export default SocialButton;
