import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment, Patient } from '@/models/types';
import { useColors } from '@/hooks/useColors';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTime, formatDateMedium } from '@/utils/dateUtils';

interface Props {
  appointment: Appointment;
  patient?: Patient;
  onPress: () => void;
  showDate?: boolean;
}

export function AppointmentCard({ appointment, patient, onPress, showDate = false }: Props) {
  const colors = useColors();

  const leftBarColor =
    appointment.status === 'scheduled'
      ? colors.statusScheduled
      : appointment.status === 'completed'
        ? colors.statusCompleted
        : appointment.status === 'cancelled'
          ? colors.statusCancelled
          : colors.statusRescheduled;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.leftBar, { backgroundColor: leftBarColor }]} />

      <View style={styles.timeCol}>
        <Text style={[styles.time, { color: colors.primary }]}>{formatTime(appointment.time)}</Text>
        {showDate && (
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDateMedium(appointment.date)}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {patient ? (
          <>
            <Text style={[styles.patientName, { color: colors.foreground }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            {patient.childName ? (
              <View style={styles.childRow}>
                <Ionicons name="person-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.childName, { color: colors.mutedForeground }]}>
                  {patient.childName}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.patientName, { color: colors.mutedForeground }]}>
            Unknown patient
          </Text>
        )}
        {appointment.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {appointment.notes}
          </Text>
        ) : null}
        <View style={styles.badgeRow}>
          <StatusBadge status={appointment.status} size="sm" />
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  timeCol: {
    paddingLeft: 12,
    paddingVertical: 14,
    width: 74,
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    gap: 3,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  childName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  notes: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  badgeRow: {
    marginTop: 4,
  },
});
