import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({ visible, value, onSelect, onClose }: Props) {
  const colors = useColors();

  const initial = value
    ? { year: parseInt(value.slice(0, 4)), month: parseInt(value.slice(5, 7)) - 1, day: parseInt(value.slice(8, 10)) }
    : (() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }; })();

  const [view, setView] = useState({ year: initial.year, month: initial.month });
  const [selected, setSelected] = useState({ year: initial.year, month: initial.month, day: initial.day });

  const today = new Date();
  const firstDayOfMonth = new Date(view.year, view.month, 1).getDay();
  const totalDays = daysInMonth(view.year, view.month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isSelected = (day: number | null) =>
    day !== null &&
    selected.year === view.year &&
    selected.month === view.month &&
    selected.day === day;

  const isToday = (day: number | null) =>
    day !== null &&
    today.getFullYear() === view.year &&
    today.getMonth() === view.month &&
    today.getDate() === day;

  const prevMonth = () => {
    setView((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 },
    );
  };

  const nextMonth = () => {
    setView((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 },
    );
  };

  const handleDayPress = (day: number) => {
    const sel = { year: view.year, month: view.month, day };
    setSelected(sel);
    const mm = String(sel.month + 1).padStart(2, '0');
    const dd = String(sel.day).padStart(2, '0');
    onSelect(`${sel.year}-${mm}-${dd}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View
            style={[
              styles.container,
              { backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border },
            ]}
          >
            {/* Month navigation */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                {MONTHS[view.month]} {view.year}
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.weekRow}>
              {DAY_HEADERS.map((d, i) => (
                <Text key={i} style={[styles.dayHeader, { color: colors.mutedForeground }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.dayCell,
                      isSelected(day) && { backgroundColor: colors.primary },
                      !isSelected(day) && isToday(day) && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => day && handleDayPress(day)}
                    disabled={!day}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.foreground },
                        isSelected(day) && { color: colors.primaryForeground },
                        isToday(day) && !isSelected(day) && { color: colors.primary, fontFamily: 'Inter_700Bold' },
                        !day && { opacity: 0 },
                      ]}
                    >
                      {day ?? 0}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    padding: 20,
    borderWidth: 1,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayHeader: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingBottom: 4,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
});
