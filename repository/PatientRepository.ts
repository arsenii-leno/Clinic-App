import { assertPatientInput, isPatient, Patient, PatientInput } from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';
import { GoogleSheetsRepository } from './GoogleSheetsRepository';

const PATIENTS_KEY = '@clinic:patients:v2';

// Create a single instance of GoogleSheetsRepository
const sheetsRepository = new GoogleSheetsRepository();

export async function getAllPatients(): Promise<Patient[]> {
  console.log('[PatientRepository.getAllPatients] Starting fetch...');
  const localPatients = await readCollection(PATIENTS_KEY, isPatient);

  try {
    console.log('[PatientRepository.getAllPatients] Attempting to fetch from Google Sheets...');
    const sheetsPatients = await sheetsRepository.getPatients();

    // Об'єднуємо дані: локальні перекривають Sheets (зберігаємо несинхронізовані нові записи)
    const patientMap = new Map(sheetsPatients.map((p) => [p.id, p]));
    localPatients.forEach((p) => patientMap.set(p.id, p));
    const merged = Array.from(patientMap.values());

    // Оновлюємо кеш AsyncStorage об'єднаними даними для офлайн-режиму
    await mutateCollection(PATIENTS_KEY, isPatient, () => ({
      items: merged,
      result: undefined
    }));

    return merged;
  } catch (error) {
    console.warn('[PatientRepository.getAllPatients] Google Sheets fetch failed, falling back to local storage:', error);
    return localPatients;
  }
}

export function createPatient(input: PatientInput): Promise<Patient> {
  assertPatientInput(input);
  return mutateCollection(PATIENTS_KEY, isPatient, (patients) => {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...input,
      id: generateId('patient'),
      createdAt: now,
      updatedAt: now,
    };
    return { items: [...patients, patient], result: patient };
  });
}

export function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  assertPatientInput(input);
  return mutateCollection(PATIENTS_KEY, isPatient, (patients) => {
    const index = patients.findIndex((patient) => patient.id === id);
    if (index < 0) throw new Error('Patient not found.');
    const patient = { ...patients[index], ...input, updatedAt: new Date().toISOString() };
    const next = [...patients];
    next[index] = patient;
    return { items: next, result: patient };
  });
}

export function deletePatient(id: string): Promise<void> {
  return mutateCollection(PATIENTS_KEY, isPatient, (patients) => ({
    items: patients.filter((patient) => patient.id !== id),
    result: undefined,
  }));
}
