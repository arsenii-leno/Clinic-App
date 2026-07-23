import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useSnack } from '@/context/SnackBarContext';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { AppointmentStatus } from '@/models/types';
import { formatDateLong, formatTime } from '@/utils/dateUtils';

const STATUS_ACTIONS: { status: AppointmentStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'scheduled', label: 'Scheduled', icon: 'calendar-outline' },
  { status: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
  { status: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
  { status: 'rescheduled', label: 'Rescheduled', icon: 'refresh-circle-outline' },
];

export default function AppointmentDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPatientById, editAppointment, removeAppointment, appointments } = useData();
  const { showSnack } = useSnack();

  const appointment = appointments.find((a) => a.id === id);
  const patient = appointment ? getPatientById(appointment.patientId) : undefined;

  const handleStatusChange = useCallback(
    async (newStatus: AppointmentStatus) => {
      if (!appointment || appointment.status === newStatus) return;
      await Haptics.selectionAsync();
      await editAppointment(id, { ...appointment, status: newStatus });
      showSnack(`Status: ${newStatus}`, 'success');
    },
    [appointment, id, editAppointment, showSnack],
  );

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Appointment', 'Remove this appointment? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await removeAppointment(id);
          showSnack('Appointment deleted', 'error');
          router.back();
        },
      },
    ]);
  }, [id, removeAppointment, showSnack]);

  if (!appointment) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Appointment' }} />
        <EmptyState icon="calendar-outline" title="Appointment not found" />
      </View>
    );
  }

  const initials = patient
    ? (patient.firstName.charAt(0) + patient.lastName.charAt(0)).toUpperCase()
    : '?';

  const statusColor =
    appointment.status === 'scheduled' ? colors.statusScheduled :
    appointment.status === 'completed' ? colors.statusCompleted :
    appointment.status === 'cancelled' ? colors.statusCancelled :
    colors.statusRescheduled;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Appointment',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => router.push(`/appointment/edit/${id}`)}
                style={styles.headerBtn}
              >
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={22} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Time card */}
        <View style={[styles.timeCard, { backgroundColor: statusColor }]}>
          <Text style={styles.timeText}>{formatTime(appointment.time)}</Text>
          <Text style={styles.dateText}>{formatDateLong(appointment.date)}</Text>
          <View style={styles.statusBadgeWrap}>
            <StatusBadge status={appointment.status} />
          </View>
        </View>

        {/* Patient */}
        {patient ? (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/patient/${patient.id}`)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.foreground }]}>
                {patient.firstName} {patient.lastName}
              </Text>
              {patient.childName ? (
                <Text style={[styles.patientSub, { color: colors.mutedForeground }]}>
                  Child: {patient.childName}
                </Text>
              ) : null}
              <Text style={[styles.patientSub, { color: colors.mutedForeground }]}>{patient.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}

        {/* Notes */}
        {appointment.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={[styles.notesLabel, { color: colors.foreground }]}>Notes</Text>
            </View>
            <Text style={[styles.notesText, { color: colors.foreground }]}>{appointment.notes}</Text>
          </View>
        ) : null}

        {/* Status change */}
        <View style={[styles.statusSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statusSectionTitle, { color: colors.foreground }]}>Change Status</Text>
          <View style={styles.statusGrid}>
            {STATUS_ACTIONS.map((sa) => {
              const isActive = appointment.status === sa.status;
              const bg =
                sa.status === 'scheduled' ? colors.statusScheduledBg :
                sa.status === 'completed' ? colors.statusCompletedBg :
                sa.status === 'cancelled' ? colors.statusCancelledBg :
                colors.statusRescheduledBg;
              const fg =
                sa.status === 'scheduled' ? colors.statusScheduled :
                sa.status === 'completed' ? colors.statusCompleted :
                sa.status === 'cancelled' ? colors.statusCancelled :
                colors.statusRescheduled;
              return (
                <TouchableOpacity
                  key={sa.status}
                  style={[
                    styles.statusActionBtn,
                    { backgroundColor: bg, borderColor: isActive ? fg : 'transparent', borderWidth: 2 },
                  ]}
                  onPress={() => handleStatusChange(sa.status)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={sa.icon} size={20} color={fg} />
                  <Text style={[styles.statusActionLabel, { color: fg }]}>{sa.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.destructive }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Appointment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  timeCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },
  statusBadgeWrap: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
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
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  patientInfo: { flex: 1, gap: 3 },
  patientName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  patientSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  statusSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  statusSectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    width: '47%',
  },
  statusActionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
