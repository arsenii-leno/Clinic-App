import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { Patient } from '@/models/types';
import { SearchBar } from '@/components/SearchBar';

// ── Existing patient confirmation modal ─────────────────────────────────────

function ExistingPatientModal({
  patient,
  onBook,
  onCreateNew,
  onDismiss,
}: {
  patient: Patient;
  onBook: () => void;
  onCreateNew: () => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const initials = (patient.firstName.charAt(0) + patient.lastName.charAt(0)).toUpperCase();

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.card }]}
          onPress={() => {}} // stop propagation
        >
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.secondary }]}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.primary }]}>Patient Found</Text>
          </View>

          {/* Patient info */}
          <View style={styles.modalBody}>
            <View style={[styles.modalAvatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.modalInitials, { color: colors.primary }]}>{initials}</Text>
            </View>
            <Text style={[styles.modalName, { color: colors.foreground }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            {patient.childName ? (
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                <Ionicons name="person-outline" size={13} /> Child: {patient.childName}
              </Text>
            ) : null}
            {patient.phone ? (
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                <Ionicons name="call-outline" size={13} /> {patient.phone}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={onBook}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={onCreateNew}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>
                Create New Patient Instead
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Patient result row ───────────────────────────────────────────────────────

function PatientResultRow({
  patient,
  appointmentCount,
  onPress,
}: {
  patient: Patient;
  appointmentCount: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const initials = (patient.firstName.charAt(0) + patient.lastName.charAt(0)).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.resultAvatar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.resultInitials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.foreground }]}>
          {patient.firstName} {patient.lastName}
        </Text>
        <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
          {patient.childName ? `Child: ${patient.childName}  ·  ` : ''}
          {patient.phone}
        </Text>
      </View>
      <View style={[styles.apptPill, { backgroundColor: colors.muted }]}>
        <Text style={[styles.apptPillText, { color: colors.mutedForeground }]}>
          {appointmentCount} {appointmentCount === 1 ? 'appt' : 'appts'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function FindOrCreatePatientScreen() {
  const colors = useColors();
  const { patients, appointments, searchPatients } = useData();
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchPatients(query).slice(0, 6);
  }, [query, searchPatients]);

  const getApptCount = (patientId: string) =>
    appointments.filter((a) => a.patientId === patientId).length;

  const handleSelectExisting = (patient: Patient) => setSelectedPatient(patient);

  const handleBook = () => {
    if (!selectedPatient) return;
    router.replace({
      pathname: '/appointment/new',
      params: { patientId: selectedPatient.id },
    });
  };

  const handleCreateNew = () => {
    setSelectedPatient(null);
    router.push({ pathname: '/patient/new', params: { redirect: 'appointment' } });
  };

  const hasQuery = query.trim().length >= 2;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Instructions card */}
      <View style={[styles.instructionCard, { backgroundColor: colors.secondary }]}>
        <Ionicons name="search-outline" size={18} color={colors.primary} />
        <Text style={[styles.instructionText, { color: colors.secondaryForeground }]}>
          Search first to avoid duplicates. Type a name or phone number.
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Name, child name or phone…" />
      </View>

      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Results */}
        {hasQuery && results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {results.length} existing {results.length === 1 ? 'patient' : 'patients'} found
            </Text>
            {results.map((p) => (
              <PatientResultRow
                key={p.id}
                patient={p}
                appointmentCount={getApptCount(p.id)}
                onPress={() => handleSelectExisting(p)}
              />
            ))}
          </View>
        )}

        {hasQuery && results.length === 0 && (
          <View style={[styles.noResultCard, { backgroundColor: colors.muted }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.statusCompleted} />
            <Text style={[styles.noResultText, { color: colors.foreground }]}>
              No existing patient found for "{query}"
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
            {hasQuery && results.length > 0 ? 'or' : 'Ready to create?'}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Create new button */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreateNew}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Create New Patient</Text>
        </TouchableOpacity>

        <Text style={[styles.createHint, { color: colors.mutedForeground }]}>
          After adding the patient, you'll be taken directly to schedule their appointment.
        </Text>
      </ScrollView>

      {/* Existing patient modal */}
      {selectedPatient && (
        <ExistingPatientModal
          patient={selectedPatient}
          onBook={handleBook}
          onCreateNew={handleCreateNew}
          onDismiss={() => setSelectedPatient(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 12,
  },
  resultsSection: {
    gap: 8,
  },
  resultsLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInitials: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  resultSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  apptPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  apptPillText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  noResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  noResultText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  createHint: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  modalBody: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 6,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalInitials: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  modalName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  modalActions: {
    padding: 16,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
