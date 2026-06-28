import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const CustomInput = ({ iconName, placeholder, secureTextEntry, ...props }) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.inputContainer}>
      {iconName && <Feather name={iconName} size={20} color="#adb5bd" style={styles.inputIcon} />}
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#adb5bd"
        secureTextEntry={isSecure}
        {...props}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Feather name={isSecure ? "eye-off" : "eye"} size={20} color="#adb5bd" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },
});

export default CustomInput;
