import { assertPatientInput, isPatient, Patient, PatientInput } from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';
import { GoogleSheetsRepository } from './GoogleSheetsRepository';

const PATIENTS_KEY = '@clinic:patients:v2';

// Create a single instance of GoogleSheetsRepository
const sheetsRepository = new GoogleSheetsRepository();

export async function getAllPatients(): Promise<Patient[]> {
  console.log('[PatientRepository.getAllPatients] Starting fetch...');
  try {
    // Try to fetch from Google Sheets first
    console.log('[PatientRepository.getAllPatients] Attempting to fetch from Google Sheets...');
    const sheetsPatients = await sheetsRepository.getPatients();
    console.log('[PatientRepository.getAllPatients] Successfully fetched from Google Sheets:', {
      count: sheetsPatients.length,
      patients: sheetsPatients,
    });
    
    // Cache to local storage
    if (sheetsPatients.length > 0) {
      console.log('[PatientRepository.getAllPatients] Caching patients to local storage...');
      await readCollection(PATIENTS_KEY, isPatient).then(() => {
        // We're just warming up the cache, mutation happens in createPatient etc.
      });
    }
    
    return sheetsPatients;
  } catch (error) {
    console.warn('[PatientRepository.getAllPatients] Google Sheets fetch failed, falling back to local storage:', error);
    // Fallback to local storage
    return readCollection(PATIENTS_KEY, isPatient);
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
