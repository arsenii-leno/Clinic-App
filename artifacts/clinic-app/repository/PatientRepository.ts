import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient } from '@/models/types';
import { generateId } from '@/utils/idUtils';

const PATIENTS_KEY = '@clinic:patients';
const SEEDED_KEY = '@clinic:seeded_v1';

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    childName: 'Emma',
    phone: '555-234-5678',
    notes: 'Latex allergy. Prefers afternoon appointments.',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'p2',
    firstName: 'Michael',
    lastName: 'Chen',
    childName: 'Oliver',
    phone: '555-876-5432',
    notes: 'Father usually brings child.',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'p3',
    firstName: 'Emma',
    lastName: 'Williams',
    childName: 'Sophia',
    phone: '555-345-6789',
    notes: '',
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-02-01T11:00:00Z',
  },
  {
    id: 'p4',
    firstName: 'David',
    lastName: 'Brown',
    childName: 'Lucas',
    phone: '555-456-7890',
    notes: 'Bilingual — speaks Spanish.',
    createdAt: '2026-02-14T08:00:00Z',
    updatedAt: '2026-02-14T08:00:00Z',
  },
  {
    id: 'p5',
    firstName: 'Jennifer',
    lastName: 'Davis',
    childName: 'Isabella',
    phone: '555-567-8901',
    notes: 'Contact mother only.',
    createdAt: '2026-03-01T09:30:00Z',
    updatedAt: '2026-03-01T09:30:00Z',
  },
  {
    id: 'p6',
    firstName: 'Robert',
    lastName: 'Miller',
    childName: 'Ethan',
    phone: '555-678-9012',
    notes: '',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'p7',
    firstName: 'Lisa',
    lastName: 'Anderson',
    childName: 'Ava',
    phone: '555-789-0123',
    notes: 'Prefers early morning slots.',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-05T09:00:00Z',
  },
  {
    id: 'p8',
    firstName: 'James',
    lastName: 'Wilson',
    childName: 'Noah',
    phone: '555-890-1234',
    notes: '',
    createdAt: '2026-04-20T11:00:00Z',
    updatedAt: '2026-04-20T11:00:00Z',
  },
];

export async function seedIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;
  await AsyncStorage.setItem(PATIENTS_KEY, JSON.stringify(MOCK_PATIENTS));
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

export async function getAllPatients(): Promise<Patient[]> {
  const raw = await AsyncStorage.getItem(PATIENTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Patient[];
}

export async function saveAllPatients(patients: Patient[]): Promise<void> {
  await AsyncStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient> {
  const patients = await getAllPatients();
  const now = new Date().toISOString();
  const patient: Patient = { ...data, id: generateId(), createdAt: now, updatedAt: now };
  await saveAllPatients([...patients, patient]);
  return patient;
}

export async function updatePatient(
  id: string,
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient | null> {
  const patients = await getAllPatients();
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: Patient = {
    ...patients[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  patients[idx] = updated;
  await saveAllPatients(patients);
  return updated;
}

export async function deletePatient(id: string): Promise<void> {
  const patients = await getAllPatients();
  await saveAllPatients(patients.filter((p) => p.id !== id));
}
