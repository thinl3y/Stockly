import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LoadingScreen from '../components/LoadingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemDetailsScreen from '../screens/ItemDetailsScreen';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Chooses which set of screens to show based on the auth state.
 * When the user signs in or out, React Navigation swaps the groups
 * automatically, so screens never need to navigate to "Home" by hand.
 */
export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen message="Restoring your session…" />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="ItemDetails"
            component={ItemDetailsScreen}
            options={{ title: 'Item Details' }}
          />
          <Stack.Screen
            name="AddItem"
            component={AddItemScreen}
            options={{ title: 'Add Item', presentation: 'modal' }}
          />
          <Stack.Screen
            name="EditItem"
            component={AddItemScreen}
            options={{ title: 'Edit Item' }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ headerTitle: '' }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
