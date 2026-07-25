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
import { formatDateShort, formatTime, getTodayString, getCurrentTime } from '@/utils/dateUtils';

const STATUSES: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'rescheduled'];

export default function NewAppointmentScreen() {
  const colors = useColors();
  const { addAppointment, patients, getPatientById } = useData();
  const { showSnack } = useSnack();
  const params = useLocalSearchParams<{ patientId?: string; date?: string }>();

  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [date, setDate] = useState(params.date ?? getTodayString());
  const [time, setTime] = useState(getCurrentTime());
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [notes, setNotes] = useState('');

  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ patient?: string }>({});

  const selectedPatient = getPatientById(patientId);

  const validate = () => {
    const errs: { patient?: string } = {};
    if (!selectedPatient) errs.patient = 'Please select a patient';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const appt = await addAppointment({ patientId, date, time, status, notes: notes.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnack('Appointment scheduled', 'success');
      router.replace(`/appointment/${appt.id}`);
    } catch {
      Alert.alert('Unable to schedule appointment', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
      >
        {/* Patient selector */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Patient *</Text>
          <TouchableOpacity
            style={[
              styles.pickerBtn,
              {
                backgroundColor: colors.card,
                borderColor: errors.patient ? colors.destructive : colors.border,
              },
            ]}
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
                <View style={styles.patientInfo}>
                  <Text style={[styles.patientName, { color: colors.foreground }]}>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </Text>
                  {selectedPatient.childName ? (
                    <Text style={[styles.patientSub, { color: colors.mutedForeground }]}>
                      Child: {selectedPatient.childName}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <Text style={[styles.pickerPlaceholder, { color: colors.mutedForeground }]}>
                Select a patient...
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {errors.patient ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.patient}</Text>
          ) : null}
        </View>

        {/* Date */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Date</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.pickerContent}>
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
            <View style={styles.pickerContent}>
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
            { backgroundColor: saving ? colors.mutedForeground : colors.primary },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Schedule Appointment'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>

      <PatientSelectorModal
        visible={showPatientPicker}
        patients={patients}
        selectedId={patientId}
        onSelect={(p) => {
          setPatientId(p.id);
          setErrors({});
        }}
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
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerValue: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  pickerPlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
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
  miniInitials: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  patientSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
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
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
});
