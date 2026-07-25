import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { Patient } from '@/models/types';
import { PatientCard } from '@/components/PatientCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';

export default function PatientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { patients, appointments, loading, reload } = useData();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.childName.toLowerCase().includes(q) ||
        p.phone.includes(q),
    );
  }, [patients, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName),
    );
  }, [filtered]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const getCount = (patientId: string) =>
    appointments.filter((a) => a.patientId === patientId).length;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Patients</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'} total
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/patient/new')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, child or phone..."
          />
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 20 },
          sorted.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
          ) : query ? (
            <EmptyState
              icon="search-outline"
              title="No patients found"
              subtitle={`No results for "${query}"`}
            />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No patients yet"
              subtitle="Add your first patient to get started"
              actionLabel="Add Patient"
              onAction={() => router.push('/patient/new')}
            />
          )
        }
        renderItem={({ item }: { item: Patient }) => (
          <PatientCard
            patient={item}
            appointmentCount={getCount(item.id)}
            onPress={() => router.push(`/patient/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {},
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 40,
  },
});
