import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { SearchBar } from '@/components/SearchBar';
import { PatientCard } from '@/components/PatientCard';
import { AppointmentCard } from '@/components/AppointmentCard';
import { EmptyState } from '@/components/EmptyState';
import { Patient, Appointment } from '@/models/types';

type SearchSection =
  | { title: string; type: 'patient'; data: Patient[] }
  | { title: string; type: 'appointment'; data: Appointment[] };

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { searchPatients, searchAppointments, getPatientById } = useData();
  const [query, setQuery] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const results = useMemo(() => {
    if (!query.trim()) return { patients: [], appointments: [] };
    return {
      patients: searchPatients(query),
      appointments: searchAppointments(query),
    };
  }, [query, searchPatients, searchAppointments]);

  const hasResults = results.patients.length > 0 || results.appointments.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Search header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Name, child, phone..."
          autoFocus={false}
        />
      </View>

      {!hasQuery ? (
        <View style={[styles.flex, styles.center]}>
          <EmptyState
            icon="search-outline"
            title="Search patients & appointments"
            subtitle="Type a name, child name, or phone number"
          />
        </View>
      ) : !hasResults ? (
        <View style={[styles.flex, styles.center]}>
          <EmptyState
            icon="alert-circle-outline"
            title="No results"
            subtitle={`Nothing found for "${query}"`}
          />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {results.patients.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patients</Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.countText, { color: colors.primary }]}>
                        {results.patients.length}
                      </Text>
                    </View>
                  </View>
                  {results.patients.map((p) => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      onPress={() => router.push(`/patient/${p.id}`)}
                    />
                  ))}
                </View>
              )}

              {results.appointments.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      Appointments
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.countText, { color: colors.primary }]}>
                        {results.appointments.length}
                      </Text>
                    </View>
                  </View>
                  {results.appointments.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      patient={getPatientById(a.patientId)}
                      onPress={() => router.push(`/appointment/${a.id}`)}
                      showDate
                    />
                  ))}
                </View>
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
