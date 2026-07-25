import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useSnack } from '@/context/SnackBarContext';
import { AppointmentCard } from '@/components/AppointmentCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDateMedium, formatTime } from '@/utils/dateUtils';

export default function PatientDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPatientById, getAppointmentsByPatient, removePatient } = useData();
  const { showSnack } = useSnack();

  const patient = getPatientById(id);
  const appointments = patient ? getAppointmentsByPatient(id) : [];
  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled');

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Patient',
      `Remove ${patient?.firstName} ${patient?.lastName} and all their appointments? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await removePatient(id);
              showSnack('Patient deleted', 'error');
              router.back();
            } catch {
              Alert.alert('Unable to delete patient', 'Please try again.');
            }
          },
        },
      ],
    );
  }, [patient, id, removePatient, showSnack]);

  if (!patient) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Patient' }} />
        <EmptyState icon="person-outline" title="Patient not found" />
      </View>
    );
  }

  const initials = (patient.firstName.charAt(0) + patient.lastName.charAt(0)).toUpperCase();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `${patient.firstName} ${patient.lastName}`,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => router.push(`/patient/edit/${id}`)}
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
        {/* Patient card */}
        <View
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {patient.firstName} {patient.lastName}
          </Text>

          <View style={styles.infoGrid}>
            <InfoRow
              icon="person-outline"
              label="Child"
              value={patient.childName || '—'}
              colors={colors}
            />
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={patient.phone || '—'}
              colors={colors}
            />
            {patient.notes ? (
              <InfoRow
                icon="document-text-outline"
                label="Notes"
                value={patient.notes}
                colors={colors}
              />
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() =>
                router.push({ pathname: '/appointment/new', params: { patientId: id } })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>New Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
              onPress={() => router.push(`/patient/edit/${id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appointments</Text>
            {appointments.length > 0 && (
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {appointments.length}
                </Text>
              </View>
            )}
          </View>

          {appointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No appointments"
              actionLabel="Schedule Appointment"
              onAction={() =>
                router.push({ pathname: '/appointment/new', params: { patientId: id } })
              }
            />
          ) : (
            appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                patient={patient}
                onPress={() => router.push(`/appointment/${appt.id}`)}
                showDate
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 20 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  initials: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  infoGrid: {
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  section: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
