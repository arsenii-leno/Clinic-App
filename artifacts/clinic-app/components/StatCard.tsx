import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface Props {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
  onPress?: () => void;
}

export function StatCard({ title, value, icon, accent = false, onPress }: Props) {
  const colors = useColors();

  const bg = accent ? colors.primary : colors.card;
  const textColor = accent ? colors.primaryForeground : colors.foreground;
  const subColor = accent ? 'rgba(255,255,255,0.75)' : colors.mutedForeground;
  const iconBg = accent ? 'rgba(255,255,255,0.2)' : colors.secondary;
  const iconColor = accent ? '#fff' : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bg, borderColor: accent ? 'transparent' : colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.title, { color: subColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
