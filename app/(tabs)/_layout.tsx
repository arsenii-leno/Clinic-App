import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={tabOptions('Home', 'home', 'home-outline')} />
      <Tabs.Screen name="patients" options={tabOptions('Patients', 'people', 'people-outline')} />
      <Tabs.Screen
        name="calendar"
        options={tabOptions('Calendar', 'calendar', 'calendar-outline')}
      />
      <Tabs.Screen name="search" options={tabOptions('Search', 'search', 'search-outline')} />
    </Tabs>
  );
}

function tabOptions(
  title: string,
  activeIcon: keyof typeof Ionicons.glyphMap,
  inactiveIcon: keyof typeof Ionicons.glyphMap,
) {
  return {
    title,
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={24} color={color} />
    ),
  };
}
