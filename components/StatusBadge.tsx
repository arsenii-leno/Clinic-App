import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppointmentStatus } from '@/models/types';
import { useColors } from '@/hooks/useColors';

interface Props {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = useColors();

  const bgColor =
    status === 'scheduled'
      ? colors.statusScheduledBg
      : status === 'completed'
        ? colors.statusCompletedBg
        : status === 'cancelled'
          ? colors.statusCancelledBg
          : colors.statusRescheduledBg;

  const textColor =
    status === 'scheduled'
      ? colors.statusScheduled
      : status === 'completed'
        ? colors.statusCompleted
        : status === 'cancelled'
          ? colors.statusCancelled
          : colors.statusRescheduled;

  const dotColor = textColor;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: textColor }, size === 'sm' && styles.labelSm]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  labelSm: {
    fontSize: 11,
  },
});
