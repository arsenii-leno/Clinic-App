import {
  Appointment,
  AppointmentInput,
  assertAppointmentInput,
  isAppointment,
} from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';
import { GoogleSheetsRepository } from './GoogleSheetsRepository';

const APPOINTMENTS_KEY = '@clinic:appointments:v2';

// Create a single instance of GoogleSheetsRepository
const sheetsRepository = new GoogleSheetsRepository();

export async function getAllAppointments(): Promise<Appointment[]> {
  console.log('[AppointmentRepository.getAllAppointments] Starting fetch...');
  const localAppointments = await readCollection(APPOINTMENTS_KEY, isAppointment);

  try {
    console.log('[AppointmentRepository.getAllAppointments] Attempting to fetch from Google Sheets...');
    const sheetsAppointments = await sheetsRepository.getAppointments();

    // Об'єднуємо дані: локальні перекривають Sheets
    const appointmentMap = new Map(sheetsAppointments.map((a) => [a.id, a]));
    localAppointments.forEach((a) => appointmentMap.set(a.id, a));
    const merged = Array.from(appointmentMap.values());

    // Оновлюємо кеш AsyncStorage
    await mutateCollection(APPOINTMENTS_KEY, isAppointment, () => ({
      items: merged,
      result: undefined
    }));

    return merged;
  } catch (error) {
    console.warn('[AppointmentRepository.getAllAppointments] Google Sheets fetch failed, falling back to local storage:', error);
    return localAppointments;
  }
}

export function createAppointment(input: AppointmentInput): Promise<Appointment> {
  assertAppointmentInput(input);
  return mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => {
    const now = new Date().toISOString();
    const appointment: Appointment = {
      ...input,
      id: generateId('appointment'),
      createdAt: now,
      updatedAt: now,
    };
    return { items: [...appointments, appointment], result: appointment };
  });
}

export function updateAppointment(id: string, input: AppointmentInput): Promise<Appointment> {
  assertAppointmentInput(input);
  return mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index < 0) throw new Error('Appointment not found.');
    const appointment = { ...appointments[index], ...input, updatedAt: new Date().toISOString() };
    const next = [...appointments];
    next[index] = appointment;
    return { items: next, result: appointment };
  });
}

export function deleteAppointment(id: string): Promise<void> {
  return mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => ({
    items: appointments.filter((appointment) => appointment.id !== id),
    result: undefined,
  }));
}

export function deleteAppointmentsByPatient(patientId: string): Promise<void> {
  return mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => ({
    items: appointments.filter((appointment) => appointment.patientId !== patientId),
    result: undefined,
  }));
}
