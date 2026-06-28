import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ThemeScreen from '../screens/ThemeScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import CommunitySelectionScreen from '../screens/CommunitySelectionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WalletScreen from '../screens/WalletScreen';
import MembersScreen from '../screens/MembersScreen';
import ContributionsScreen from '../screens/ContributionsScreen';
import LedgerScreen from '../screens/LedgerScreen';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="VerifyOtp" 
        component={VerifyOtpScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="CommunitySelection" 
        component={CommunitySelectionScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Theme" 
        component={ThemeScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Members" component={MembersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Contributions" component={ContributionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Ledger" component={LedgerScreen} options={{ headerShown: false }} />
      {/* You can add more stack screens here that are not part of the bottom tabs */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
