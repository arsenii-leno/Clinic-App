import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '@/models/types';
import { useColors } from '@/hooks/useColors';

interface Props {
  patient: Patient;
  onPress: () => void;
  appointmentCount?: number;
}

export function PatientCard({ patient, onPress, appointmentCount }: Props) {
  const colors = useColors();

  const initials = (patient.firstName.charAt(0) + patient.lastName.charAt(0)).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {patient.firstName} {patient.lastName}
        </Text>
        {patient.childName ? (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.detail, { color: colors.mutedForeground }]}>
              {patient.childName}
            </Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detail, { color: colors.mutedForeground }]}>{patient.phone}</Text>
        </View>
        {patient.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {patient.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {appointmentCount !== undefined ? (
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Ionicons name="calendar-outline" size={12} color={colors.primary} />
            <Text style={[styles.countText, { color: colors.primary }]}>{appointmentCount}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  notes: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: 2,
  },
  right: {
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
