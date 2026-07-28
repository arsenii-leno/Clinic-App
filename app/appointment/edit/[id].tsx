import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useSnack } from '@/context/SnackBarContext';
import { AppointmentStatus } from '@/models/types';
import { DatePickerModal } from '@/components/DatePickerModal';
import { TimePickerModal } from '@/components/TimePickerModal';
import { PatientSelectorModal } from '@/components/PatientSelectorModal';
import { StatusBadge } from '@/components/StatusBadge';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { formatDateShort, formatTime, getOccupiedTimeSlots } from '@/utils/dateUtils';
import { EmptyState } from '@/components/EmptyState';

const STATUSES: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'rescheduled'];

export default function EditAppointmentScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appointments, patients, getPatientById, editAppointment } = useData();
  const { showSnack } = useSnack();

  const appointment = appointments.find((a) => a.id === id);

  const [patientId, setPatientId] = useState(appointment?.patientId ?? '');
  const [date, setDate] = useState(appointment?.date ?? '');
  const [time, setTime] = useState(appointment?.time ?? '');
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? 'scheduled');
  const [notes, setNotes] = useState(appointment?.notes ?? '');

  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPatient = getPatientById(patientId);
  const occupiedSlots = getOccupiedTimeSlots(date, appointments, id);
  const isTimeOccupied = occupiedSlots.includes(time);

  const handleSave = async () => {
    if (!selectedPatient) return;

    if (isTimeOccupied) {
      Alert.alert('Time slot taken', 'There is already an active appointment at this time.');
      return;
    }

    setSaving(true);
    try {
      await editAppointment(id, { patientId, date, time, status, notes: notes.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnack('Appointment updated', 'success');
      router.back();
    } catch {
      Alert.alert('Unable to save appointment', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) {
    return (
        <View style={[styles.flex, { backgroundColor: colors.background }]}>
          <EmptyState icon="calendar-outline" title="Appointment not found" />
        </View>
    );
  }

  return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <KeyboardAwareScrollViewCompat
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            bottomOffset={80}
        >
        {/* Patient */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Patient</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowPatientPicker(true)}
            activeOpacity={0.8}
          >
            {selectedPatient ? (
              <View style={styles.selectedPatient}>
                <View style={[styles.miniAvatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.miniInitials, { color: colors.primary }]}>
                    {(selectedPatient.firstName[0] + selectedPatient.lastName[0]).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.patientName, { color: colors.foreground }]}>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </Text>
              </View>
            ) : (
              <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
                Select patient...
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Date</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.pickerInner}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerValue, { color: colors.foreground }]}>
                {formatDateShort(date)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Time */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Time</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.pickerInner}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerValue, { color: colors.foreground }]}>
                {formatTime(time)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  {
                    borderColor: status === s ? colors.primary : colors.border,
                    backgroundColor: status === s ? colors.secondary : colors.card,
                  },
                ]}
                onPress={() => setStatus(s)}
                activeOpacity={0.7}
              >
                <StatusBadge status={s} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

          <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: saving || isTimeOccupied ? colors.mutedForeground : colors.primary },
              ]}
              onPress={handleSave}
              disabled={saving || isTimeOccupied}
              activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : isTimeOccupied ? 'Time is occupied' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </KeyboardAwareScrollViewCompat>

        <PatientSelectorModal
            visible={showPatientPicker}
            patients={patients}
            selectedId={patientId}
            onSelect={(p) => setPatientId(p.id)}
            onClose={() => setShowPatientPicker(false)}
        />
        <DatePickerModal
            visible={showDatePicker}
            value={date}
            onSelect={setDate}
            onClose={() => setShowDatePicker(false)}
        />
        <TimePickerModal
            visible={showTimePicker}
            value={time}
            occupiedSlots={occupiedSlots}
            onSelect={setTime}
            onClose={() => setShowTimePicker(false)}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  pickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerValue: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  placeholder: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  selectedPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniInitials: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  patientName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    height: 100,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
});
