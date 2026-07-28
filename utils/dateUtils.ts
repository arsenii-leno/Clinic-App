import type { Appointment } from '@/models/types';

const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function parseDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

export function isTomorrow(dateStr: string): boolean {
  return dateStr === getTomorrowString();
}

export function formatDateLong(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateMedium(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  const d = parseDate(dateStr);
  return `${DAYS_LONG[d.getDay()].slice(0, 3)}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function compareAppointments(
  a: { date: string; time: string },
  b: { date: string; time: string },
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
}

export function getMonthName(month: number): string {
  return MONTHS_LONG[month];
}

export function getDayName(day: number): string {
  return DAYS_LONG[day];
}

export function getDayShort(day: number): string {
  return DAYS_LONG[day].slice(0, 1);
}

export function getTodayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function hasTimeConflict(
    date: string,
    time: string,
    existingAppointments: Appointment[],
    excludeAppointmentId?: string
): boolean {
  return existingAppointments.some(
      (a) =>
          a.date === date &&
          a.time === time &&
          a.status !== 'cancelled' &&
          a.id !== excludeAppointmentId
  );
}

export function getOccupiedTimeSlots(
    date: string,
    existingAppointments: Appointment[],
    excludeAppointmentId?: string
): string[] {
  return existingAppointments
      .filter(
          (a) => a.date === date && a.status !== 'cancelled' && a.id !== excludeAppointmentId
      )
      .map((a) => a.time);
}