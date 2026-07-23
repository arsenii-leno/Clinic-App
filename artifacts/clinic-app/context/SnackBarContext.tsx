import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type SnackType = 'success' | 'error' | 'info';

interface SnackBarContextValue {
  showSnack: (message: string, type?: SnackType) => void;
}

const SnackBarContext = createContext<SnackBarContextValue | null>(null);

interface SnackState {
  message: string;
  type: SnackType;
  key: number;
}

export function SnackBarProvider({ children }: { children: React.ReactNode }) {
  const [snack, setSnack] = useState<SnackState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnack = useCallback((message: string, type: SnackType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnack({ message, type, key: Date.now() });
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: true }),
      ]).start(() => setSnack(null));
    }, 2800);
  }, [opacity, translateY]);

  return (
    <SnackBarContext.Provider value={{ showSnack }}>
      {children}
      {snack && <SnackBar message={snack.message} type={snack.type} opacity={opacity} translateY={translateY} />}
    </SnackBarContext.Provider>
  );
}

function SnackBar({
  message,
  type,
  opacity,
  translateY,
}: {
  message: string;
  type: SnackType;
  opacity: Animated.Value;
  translateY: Animated.Value;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const bottomOffset = Platform.OS === 'web' ? 34 : insets.bottom;

  const bgColor =
    type === 'success' ? colors.statusCompleted :
    type === 'error' ? colors.statusCancelled :
    colors.primary;

  return (
    <Animated.View
      style={[
        styles.snack,
        { backgroundColor: bgColor, bottom: bottomOffset + 90, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.snackText}>{message}</Text>
    </Animated.View>
  );
}

export function useSnack(): SnackBarContextValue {
  const ctx = useContext(SnackBarContext);
  if (!ctx) throw new Error('useSnack must be used within SnackBarProvider');
  return ctx;
}

const styles = StyleSheet.create({
  snack: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  snackText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
