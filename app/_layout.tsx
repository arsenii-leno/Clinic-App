import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { DataProvider } from '@/context/DataContext';
import { useData } from '@/context/DataContext';
import { SnackBarProvider } from '@/context/SnackBarContext';
import { useColors } from '@/hooks/useColors';
import { DataLoadError } from '@/components/DataLoadError';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          color: colors.foreground,
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="patient/[id]" options={{ title: 'Patient' }} />
      <Stack.Screen name="patient/new" options={{ title: 'New Patient' }} />
      <Stack.Screen name="patient/edit/[id]" options={{ title: 'Edit Patient' }} />
      <Stack.Screen name="appointment/[id]" options={{ title: 'Appointment' }} />
      <Stack.Screen name="appointment/new" options={{ title: 'New Appointment' }} />
      <Stack.Screen name="appointment/edit/[id]" options={{ title: 'Edit Appointment' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="patient/find-or-create" options={{ title: 'New Patient' }} />
    </Stack>
  );
}

function RootContent() {
  const { error, reload } = useData();
  if (error) return <DataLoadError onRetry={() => void reload()} />;
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <DataProvider>
              <SnackBarProvider>
                <RootContent />
              </SnackBarProvider>
            </DataProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
