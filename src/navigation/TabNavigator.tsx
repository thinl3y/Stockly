import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../constants/theme';
import { useShopping } from '../contexts/ShoppingContext';
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
  // Badge on the Shopping tab = number of items still to buy.
  const { pending } = useShopping();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // No fixed height: React Navigation adds the safe-area inset for the
        // iPhone home indicator and Android's gesture/button bar by itself.
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
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
        options={{
          title: 'Shopping',
          tabBarBadge: pending.length > 0 ? pending.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white, fontSize: 11 },
        }}
      />
      <Tab.Screen name="History" component={PurchaseHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
