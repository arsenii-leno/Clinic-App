import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '@/models/types';
import { generateId } from '@/utils/idUtils';

const APPOINTMENTS_KEY = '@clinic:appointments';
const SEEDED_KEY = '@clinic:appts_seeded_v1';

// Mock data seeded with dates relative to 2026-07-22 (today in this project)
const MOCK_APPOINTMENTS: Appointment[] = [
  // Today 2026-07-22
  {
    id: 'a1',
    patientId: 'p1',
    date: '2026-07-22',
    time: '09:00',
    status: 'scheduled',
    notes: 'Routine checkup.',
    createdAt: '2026-07-20T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    id: 'a2',
    patientId: 'p2',
    date: '2026-07-22',
    time: '10:30',
    status: 'scheduled',
    notes: 'Follow-up visit.',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z',
  },
  {
    id: 'a3',
    patientId: 'p3',
    date: '2026-07-22',
    time: '14:00',
    status: 'completed',
    notes: '',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-07-22T14:45:00Z',
  },
  {
    id: 'a4',
    patientId: 'p4',
    date: '2026-07-22',
    time: '16:00',
    status: 'cancelled',
    notes: 'Family emergency.',
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-21T11:00:00Z',
  },
  // Tomorrow 2026-07-23
  {
    id: 'a5',
    patientId: 'p5',
    date: '2026-07-23',
    time: '09:30',
    status: 'scheduled',
    notes: '',
    createdAt: '2026-07-19T09:00:00Z',
    updatedAt: '2026-07-19T09:00:00Z',
  },
  {
    id: 'a6',
    patientId: 'p6',
    date: '2026-07-23',
    time: '11:00',
    status: 'scheduled',
    notes: 'Bring previous X-ray results.',
    createdAt: '2026-07-17T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'a7',
    patientId: 'p7',
    date: '2026-07-23',
    time: '15:30',
    status: 'scheduled',
    notes: '',
    createdAt: '2026-07-16T09:30:00Z',
    updatedAt: '2026-07-16T09:30:00Z',
  },
  // Yesterday 2026-07-21
  {
    id: 'a8',
    patientId: 'p8',
    date: '2026-07-21',
    time: '10:00',
    status: 'completed',
    notes: '',
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-07-21T10:45:00Z',
  },
  {
    id: 'a9',
    patientId: 'p1',
    date: '2026-07-21',
    time: '14:30',
    status: 'completed',
    notes: '',
    createdAt: '2026-07-13T09:00:00Z',
    updatedAt: '2026-07-21T15:10:00Z',
  },
  // 2026-07-20
  {
    id: 'a10',
    patientId: 'p2',
    date: '2026-07-20',
    time: '09:00',
    status: 'rescheduled',
    notes: 'Rescheduled to July 23.',
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-19T16:00:00Z',
  },
  // Upcoming 2026-07-25
  {
    id: 'a11',
    patientId: 'p3',
    date: '2026-07-25',
    time: '09:00',
    status: 'scheduled',
    notes: '',
    createdAt: '2026-07-20T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    id: 'a12',
    patientId: 'p5',
    date: '2026-07-25',
    time: '11:30',
    status: 'scheduled',
    notes: 'New treatment consultation.',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
  },
];

export async function seedAppointmentsIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;
  await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(MOCK_APPOINTMENTS));
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const raw = await AsyncStorage.getItem(APPOINTMENTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Appointment[];
}

export async function saveAllAppointments(appointments: Appointment[]): Promise<void> {
  await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment> {
  const appointments = await getAllAppointments();
  const now = new Date().toISOString();
  const appt: Appointment = { ...data, id: generateId(), createdAt: now, updatedAt: now };
  await saveAllAppointments([...appointments, appt]);
  return appt;
}

export async function updateAppointment(
  id: string,
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment | null> {
  const appointments = await getAllAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const updated: Appointment = {
    ...appointments[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  appointments[idx] = updated;
  await saveAllAppointments(appointments);
  return updated;
}

export async function deleteAppointment(id: string): Promise<void> {
  const appointments = await getAllAppointments();
  await saveAllAppointments(appointments.filter((a) => a.id !== id));
}
