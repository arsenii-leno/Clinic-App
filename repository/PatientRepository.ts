import { assertPatientInput, isPatient, Patient, PatientInput } from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';
import { GoogleSheetsRepository } from './GoogleSheetsRepository';

const PATIENTS_KEY = '@clinic:patients:v2';
const sheetsRepository = new GoogleSheetsRepository();

export async function getAllPatients(): Promise<Patient[]> {
  console.log('[PatientRepository.getAllPatients] Fetching from local storage...');
  // Для MVP читаємо тільки з локального кешу, щоб не затерти зміни
  return readCollection(PATIENTS_KEY, isPatient);
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  assertPatientInput(input);

  const newPatient = await mutateCollection(PATIENTS_KEY, isPatient, (patients) => {
    const now = new Date().toISOString();

    const patient: Patient = {
      ...input,
      id: generateId('patient'),
      createdAt: now,
      updatedAt: now,
    };

    return { items: [...patients, patient], result: patient };
  });

  sheetsRepository.savePatient(newPatient).catch((error) => {
    console.error('[Sync] Failed to sync new patient to Google Sheets:', error);
  });

  return newPatient;
}

export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  assertPatientInput(input);

  const updatedPatient = await mutateCollection(PATIENTS_KEY, isPatient, (patients) => {
    const index = patients.findIndex((patient) => patient.id === id);

    if (index < 0) {
      throw new Error('Patient not found.');
    }

    const patient = {
      ...patients[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const next = [...patients];
    next[index] = patient;

    return { items: next, result: patient };
  });

  sheetsRepository.savePatient(updatedPatient).catch((error) => {
    console.error('[Sync] Failed to update patient in Google Sheets:', error);
  });

  return updatedPatient;
}

export async function deletePatient(id: string): Promise<void> {
  await mutateCollection(PATIENTS_KEY, isPatient, (patients) => ({
    items: patients.filter((patient) => patient.id !== id),
    result: undefined,
  }));
}