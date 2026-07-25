import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Patient } from '@/models/types';
import * as LocalPatientRepo from './PatientRepository';
import * as LocalAppointmentRepo from './AppointmentRepository';

const SETTINGS_KEY = '@clinic:google_sheets_settings';
const LAST_SYNC_KEY = '@clinic:google_sheets_last_sync';
const API_BASE_URL = 'http://127.0.0.1:3000';

export interface GoogleSheetsSettings {
  spreadsheetId: string;
  serviceAccountJson: string;
  enabled: boolean;
  lastSyncedAt?: string;
}

export interface GoogleSheetsConnectionResult {
  ok: boolean;
  title?: string;
  email?: string;
  error?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'Unknown error');
}

async function readSettings(): Promise<GoogleSheetsSettings | null> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as GoogleSheetsSettings;
}

async function writeSettings(settings: GoogleSheetsSettings | null): Promise<void> {
  if (!settings) {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return;
  }
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function setLastSync(ts?: string): Promise<void> {
  if (!ts) {
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    return;
  }
  await AsyncStorage.setItem(LAST_SYNC_KEY, ts);
}

export async function getSettings(): Promise<GoogleSheetsSettings | null> {
  return readSettings();
}

export async function getLastSync(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `Request failed with ${response.status}`);
  }
  if (!body) return {} as T;
  return JSON.parse(body) as T;
}

async function withRemoteData<T>(
  action: (settings: GoogleSheetsSettings) => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  const settings = await readSettings();
  if (!settings?.enabled || !settings.spreadsheetId || !settings.serviceAccountJson) {
    return fallback();
  }

  try {
    return await action(settings);
  } catch (error) {
    console.warn('Google Sheets sync failed, falling back to local storage:', getErrorMessage(error));
    return fallback();
  }
}

export async function connect(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<boolean> {
  try {
    const result = await requestJson<GoogleSheetsConnectionResult>('/api/sheets/test-connection', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId, serviceAccountJson }),
    });
    if (!result.ok) {
      await writeSettings(null);
      return false;
    }

    await requestJson('/api/sheets/init', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId, serviceAccountJson }),
    });

    await writeSettings({ spreadsheetId, serviceAccountJson, enabled: true, lastSyncedAt: new Date().toISOString() });
    await setLastSync(new Date().toISOString());
    return true;
  } catch (error) {
    await writeSettings(null);
    return false;
  }
}

export async function disconnect(): Promise<void> {
  await writeSettings(null);
  await setLastSync(undefined);
}

export async function testConnection(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<GoogleSheetsConnectionResult> {
  try {
    return await requestJson<GoogleSheetsConnectionResult>('/api/sheets/test-connection', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId, serviceAccountJson }),
    });
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function syncNow(): Promise<{ patients: Patient[]; appointments: Appointment[] }> {
  const settings = await readSettings();
  if (!settings?.enabled || !settings.spreadsheetId || !settings.serviceAccountJson) {
    const [patients, appointments] = await Promise.all([
      LocalPatientRepo.getAllPatients(),
      LocalAppointmentRepo.getAllAppointments(),
    ]);
    return { patients, appointments };
  }

  try {
    const response = await requestJson<{ patients: Patient[]; appointments: Appointment[] }>('/api/sheets/sync', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson }),
    });
    const { patients, appointments } = response;
    await LocalPatientRepo.saveAllPatients(patients ?? []);
    await LocalAppointmentRepo.saveAllAppointments(appointments ?? []);
    await setLastSync(new Date().toISOString());
    return { patients: patients ?? [], appointments: appointments ?? [] };
  } catch (error) {
    const [patients, appointments] = await Promise.all([
      LocalPatientRepo.getAllPatients(),
      LocalAppointmentRepo.getAllAppointments(),
    ]);
    return { patients, appointments };
  }
}

export async function seedIfNeeded(): Promise<void> {
  const settings = await readSettings();
  if (!settings?.enabled || !settings.spreadsheetId || !settings.serviceAccountJson) {
    await LocalPatientRepo.seedIfNeeded();
    await LocalAppointmentRepo.seedAppointmentsIfNeeded();
    return;
  }

  try {
    const { patients, appointments } = await syncNow();
    await LocalPatientRepo.saveAllPatients(patients);
    await LocalAppointmentRepo.saveAllAppointments(appointments);
  } catch (error) {
    await LocalPatientRepo.seedIfNeeded();
    await LocalAppointmentRepo.seedAppointmentsIfNeeded();
  }
}

export async function getAllPatients(): Promise<Patient[]> {
  return withRemoteData(
    async (settings) => {
      const response = await requestJson<{ patients: Patient[] }>('/api/sheets/data', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson }),
      });
      const patients = response.patients ?? [];
      await LocalPatientRepo.saveAllPatients(patients);
      await setLastSync(new Date().toISOString());
      return patients;
    },
    () => LocalPatientRepo.getAllPatients(),
  );
}

export async function saveAllPatients(patients: Patient[]): Promise<void> {
  await LocalPatientRepo.saveAllPatients(patients);
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient> {
  return withRemoteData(
    async (settings) => {
      const patient = await requestJson<Patient>('/api/sheets/patients', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson, patient: data }),
      });
      const existing = await LocalPatientRepo.getAllPatients();
      const next = [...existing.filter((item) => item.id !== patient.id), patient];
      await LocalPatientRepo.saveAllPatients(next);
      await setLastSync(new Date().toISOString());
      return patient;
    },
    async () => LocalPatientRepo.createPatient(data),
  );
}

export async function updatePatient(
  id: string,
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient | null> {
  return withRemoteData(
    async (settings) => {
      const patient = await requestJson<Patient>(`/api/sheets/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson, patient: data }),
      });
      const existing = await LocalPatientRepo.getAllPatients();
      const next = [...existing.filter((item) => item.id !== patient.id), patient];
      await LocalPatientRepo.saveAllPatients(next);
      await setLastSync(new Date().toISOString());
      return patient;
    },
    async () => LocalPatientRepo.updatePatient(id, data),
  );
}

export async function deletePatient(id: string): Promise<void> {
  return withRemoteData(
    async (settings) => {
      await requestJson(`/api/sheets/patients/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson }),
      });
      const existing = await LocalPatientRepo.getAllPatients();
      await LocalPatientRepo.saveAllPatients(existing.filter((item) => item.id !== id));
      await setLastSync(new Date().toISOString());
    },
    async () => LocalPatientRepo.deletePatient(id),
  );
}

export async function seedAppointmentsIfNeeded(): Promise<void> {
  const settings = await readSettings();
  if (!settings?.enabled || !settings.spreadsheetId || !settings.serviceAccountJson) {
    await LocalAppointmentRepo.seedAppointmentsIfNeeded();
    return;
  }

  try {
    const { appointments } = await syncNow();
    await LocalAppointmentRepo.saveAllAppointments(appointments);
  } catch (error) {
    await LocalAppointmentRepo.seedAppointmentsIfNeeded();
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  return withRemoteData(
    async (settings) => {
      const response = await requestJson<{ appointments: Appointment[] }>('/api/sheets/data', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson }),
      });
      const appointments = response.appointments ?? [];
      await LocalAppointmentRepo.saveAllAppointments(appointments);
      await setLastSync(new Date().toISOString());
      return appointments;
    },
    () => LocalAppointmentRepo.getAllAppointments(),
  );
}

export async function saveAllAppointments(appointments: Appointment[]): Promise<void> {
  await LocalAppointmentRepo.saveAllAppointments(appointments);
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment> {
  return withRemoteData(
    async (settings) => {
      const appointment = await requestJson<Appointment>('/api/sheets/appointments', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson, appointment: data }),
      });
      const existing = await LocalAppointmentRepo.getAllAppointments();
      const next = [...existing.filter((item) => item.id !== appointment.id), appointment];
      await LocalAppointmentRepo.saveAllAppointments(next);
      await setLastSync(new Date().toISOString());
      return appointment;
    },
    async () => LocalAppointmentRepo.createAppointment(data),
  );
}

export async function updateAppointment(
  id: string,
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment | null> {
  return withRemoteData(
    async (settings) => {
      const appointment = await requestJson<Appointment>(`/api/sheets/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson, appointment: data }),
      });
      const existing = await LocalAppointmentRepo.getAllAppointments();
      const next = [...existing.filter((item) => item.id !== appointment.id), appointment];
      await LocalAppointmentRepo.saveAllAppointments(next);
      await setLastSync(new Date().toISOString());
      return appointment;
    },
    async () => LocalAppointmentRepo.updateAppointment(id, data),
  );
}

export async function deleteAppointment(id: string): Promise<void> {
  return withRemoteData(
    async (settings) => {
      await requestJson(`/api/sheets/appointments/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ spreadsheetId: settings.spreadsheetId, serviceAccountJson: settings.serviceAccountJson }),
      });
      const existing = await LocalAppointmentRepo.getAllAppointments();
      await LocalAppointmentRepo.saveAllAppointments(existing.filter((item) => item.id !== id));
      await setLastSync(new Date().toISOString());
    },
    async () => LocalAppointmentRepo.deleteAppointment(id),
  );
}
