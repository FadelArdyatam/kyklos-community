import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigations/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CommunityProvider } from './src/context/CommunityContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CommunityProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CommunityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
