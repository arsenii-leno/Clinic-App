import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function DataLoadError({ onRetry }: { onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Unable to load clinic data</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>Please try again.</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onRetry}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  message: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  button: { marginTop: 8, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
