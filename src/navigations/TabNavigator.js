import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import PocketsScreen from '../screens/PocketsScreen';
import ArisanScreen from '../screens/ArisanScreen';
import SocialScreen from '../screens/SocialScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
          borderTopWidth: 1,
          elevation: 0,
          paddingHorizontal: 10,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;
          let labelText;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            labelText = 'Home';
          } else if (route.name === 'Pockets') {
            iconName = focused ? 'wallet' : 'wallet-outline';
            labelText = 'Pockets';
          } else if (route.name === 'Arisan') {
            iconName = focused ? 'people' : 'people-outline';
            labelText = 'Arisan';
          } else if (route.name === 'Social') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            labelText = 'Social';
          }

          const color = focused ? '#ffffff' : '#6c757d';

          return (
            <View
              style={[
                styles.tabContainer,
                focused && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name={iconName} size={22} color={color} />
              <Text
                style={[
                  styles.tabLabel,
                  focused ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
              >
                {labelText}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pockets" component={PocketsScreen} />
      <Tab.Screen name="Arisan" component={ArisanScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 55,
    borderRadius: 14,
    marginTop: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#ffffff',
  },
  inactiveTabLabel: {
    color: '#6c757d',
  },
});

export default TabNavigator;
