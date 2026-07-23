import React, { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
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
import { AppointmentCard } from '@/components/AppointmentCard';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDateLong, getTodayGreeting, getTodayString } from '@/utils/dateUtils';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { patients, loading, getTodayAppointments, getTomorrowAppointments, getPatientById, reload } =
    useData();
  const [refreshing, setRefreshing] = useState(false);

  const todayAppts = getTodayAppointments();
  const tomorrowAppts = getTomorrowAppointments();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Teal header */}
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getTodayGreeting()}</Text>
              <Text style={styles.dateText}>{formatDateLong(getTodayString())}</Text>
            </View>
            <TouchableOpacity
              style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.75}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard title="Today" value={todayAppts.length} icon="today-outline" accent />
            <StatCard title="Tomorrow" value={tomorrowAppts.length} icon="calendar-outline" />
            <StatCard
              title="Patients"
              value={patients.length}
              icon="people-outline"
              onPress={() => router.push('/(tabs)/patients')}
            />
          </View>

          {/* Quick actions */}
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="add-circle"
              label="New Appointment"
              onPress={() => router.push('/appointment/new')}
              primary
              colors={colors}
            />
            <QuickAction
              icon="person-add"
              label="New Patient"
              onPress={() => router.push('/patient/find-or-create')}
              colors={colors}
            />
            <QuickAction
              icon="calendar"
              label="Calendar"
              onPress={() => router.push('/(tabs)/calendar')}
              colors={colors}
            />
            <QuickAction
              icon="search"
              label="Search"
              onPress={() => router.push('/(tabs)/search')}
              colors={colors}
            />
          </View>

          {/* Today's appointments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Today's Appointments
              </Text>
              {todayAppts.length > 0 && (
                <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.countPillText, { color: colors.primary }]}>
                    {todayAppts.length}
                  </Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Loading...
                </Text>
              </View>
            ) : todayAppts.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No appointments today"
                subtitle="Tap the button below to schedule one"
                actionLabel="New Appointment"
                onAction={() => router.push('/appointment/new')}
              />
            ) : (
              todayAppts.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  patient={getPatientById(appt.patientId)}
                  onPress={() => router.push(`/appointment/${appt.id}`)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 72 }]}
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  primary = false,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        {
          backgroundColor: primary ? colors.primary : colors.card,
          borderColor: primary ? 'transparent' : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={30} color={primary ? '#fff' : colors.primary} />
      <Text
        style={[styles.quickLabel, { color: primary ? '#fff' : colors.foreground }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    minHeight: 600,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
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
  countPillText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
