import { assertPatientInput, isPatient, Patient, PatientInput } from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';

const PATIENTS_KEY = '@clinic:patients:v2';

export function getAllPatients(): Promise<Patient[]> {
  return readCollection(PATIENTS_KEY, isPatient);
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
