import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { formatTime } from '@/utils/dateUtils';

// Generate time slots from 07:00 to 20:00 in 15-minute steps
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 20; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

interface Props {
  visible: boolean;
  value: string; // HH:MM
  onSelect: (time: string) => void;
  onClose: () => void;
}

export function TimePickerModal({ visible, value, onSelect, onClose }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState(value || '09:00');

  const handleSelect = (time: string) => {
    setSelected(time);
    onSelect(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View
            style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Select Time</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.doneBtn, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              numColumns={4}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => {
                const isActive = item === selected;
                return (
                  <TouchableOpacity
                    style={[
                      styles.timeChip,
                      { borderColor: colors.border },
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        { color: colors.foreground },
                        isActive && {
                          color: colors.primaryForeground,
                          fontFamily: 'Inter_700Bold',
                        },
                      ]}
                    >
                      {formatTime(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
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
    justifyContent: 'flex-end',
    padding: 16,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  doneBtn: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  grid: {
    padding: 12,
    gap: 8,
  },
  timeChip: {
    flex: 1,
    margin: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
