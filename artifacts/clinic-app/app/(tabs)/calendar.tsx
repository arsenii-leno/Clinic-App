import React, { useMemo, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { AppointmentCard } from '@/components/AppointmentCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDateMedium, getMonthName, getTodayString } from '@/utils/dateUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointments, getPatientById, getAppointmentsByDate } = useData();

  const todayStr = getTodayString();
  const todayDate = new Date(todayStr + 'T00:00:00');

  const [viewMonth, setViewMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  const appointmentDates = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => set.add(a.date));
    return set;
  }, [appointments]);

  const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const makeDateStr = (day: number): string => {
    const mm = String(viewMonth.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewMonth.year}-${mm}-${dd}`;
  };

  const isSelected = (day: number | null) => day !== null && makeDateStr(day) === selectedDate;
  const isToday = (day: number | null) => day !== null && makeDateStr(day) === todayStr;
  const hasAppts = (day: number | null) => day !== null && appointmentDates.has(makeDateStr(day));

  const prevMonth = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMonth((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 },
    );
  };

  const nextMonth = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMonth((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 },
    );
  };

  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarExpanded((v) => !v);
  };

  const selectedAppts = getAppointmentsByDate(selectedDate);
  const selectedApptCount = selectedAppts.length;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Calendar header panel */}
      <View
        style={[
          styles.calendarPanel,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {/* Month nav + collapse toggle */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.monthTitleBtn} onPress={toggleCalendar} activeOpacity={0.7}>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {getMonthName(viewMonth.month)} {viewMonth.year}
            </Text>
            <Ionicons
              name={calendarExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day labels — always visible */}
        <View style={styles.dayLabelsRow}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={[styles.dayLabel, { color: colors.mutedForeground }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid — collapsible */}
        {calendarExpanded && (
          <View style={styles.grid}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.dayCell,
                      isSelected(day) && { backgroundColor: colors.primary },
                      !isSelected(day) && isToday(day) && {
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => day && setSelectedDate(makeDateStr(day))}
                    disabled={!day}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        { color: colors.foreground },
                        isSelected(day) && { color: '#fff', fontFamily: 'Inter_700Bold' },
                        isToday(day) &&
                          !isSelected(day) && { color: colors.primary, fontFamily: 'Inter_700Bold' },
                        !day && { opacity: 0 },
                      ]}
                    >
                      {day ?? 0}
                    </Text>
                    {hasAppts(day) && (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected(day)
                              ? 'rgba(255,255,255,0.75)'
                              : colors.primary,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Collapsed: show selected date chip */}
        {!calendarExpanded && (
          <TouchableOpacity
            style={[styles.collapsedDateChip, { backgroundColor: colors.secondary }]}
            onPress={toggleCalendar}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={[styles.collapsedDateText, { color: colors.primary }]}>
              {formatDateMedium(selectedDate)}
              {selectedApptCount > 0 ? `  ·  ${selectedApptCount} appointment${selectedApptCount > 1 ? 's' : ''}` : '  ·  No appointments'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Appointments list */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.apptList, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dayHeader}>
          <View>
            <Text style={[styles.dayHeaderTitle, { color: colors.foreground }]}>
              {selectedDate === todayStr ? 'Today' : formatDateMedium(selectedDate)}
            </Text>
            <Text style={[styles.dayHeaderSub, { color: colors.mutedForeground }]}>
              {selectedApptCount === 0
                ? 'No appointments'
                : `${selectedApptCount} appointment${selectedApptCount > 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addApptBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              router.push({ pathname: '/appointment/new', params: { date: selectedDate } })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {selectedApptCount === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No appointments"
            subtitle="Tap + to add one for this day"
          />
        ) : (
          selectedAppts.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              patient={getPatientById(appt.patientId)}
              onPress={() => router.push(`/appointment/${appt.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  calendarPanel: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: { padding: 6 },
  monthTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  grid: { gap: 2 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dayNum: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  collapsedDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  collapsedDateText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  apptList: { padding: 16 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  dayHeaderSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  addApptBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
