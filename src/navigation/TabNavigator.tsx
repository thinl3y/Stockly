import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** [inactive icon, active icon] for each tab. */
const TAB_ICONS: Record<keyof MainTabParamList, [IoniconName, IoniconName]> = {
  Home: ['home-outline', 'home'],
  Inventory: ['layers-outline', 'layers'],
  ShoppingList: ['cart-outline', 'cart'],
  History: ['time-outline', 'time'],
  Profile: ['person-circle-outline', 'person-circle'],
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          ...(Platform.OS === 'android' ? { height: 64, paddingBottom: 8 } : null),
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [inactive, active] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: 'Shopping' }}
      />
      <Tab.Screen name="History" component={PurchaseHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
