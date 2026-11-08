import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { InventoryProvider } from './src/contexts/InventoryContext';
import { ShoppingProvider } from './src/contexts/ShoppingContext';
import { colors } from './src/constants/theme';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <InventoryProvider>
            <ShoppingProvider>
              <NavigationContainer theme={navigationTheme}>
                <RootNavigator />
              </NavigationContainer>
            </ShoppingProvider>
          </InventoryProvider>
        </AuthProvider>
      </ErrorBoundary>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
