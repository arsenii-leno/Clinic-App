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
  try {
    // Try to fetch from Google Sheets first
    console.log('[AppointmentRepository.getAllAppointments] Attempting to fetch from Google Sheets...');
    const sheetsAppointments = await sheetsRepository.getAppointments();
    console.log('[AppointmentRepository.getAllAppointments] Successfully fetched from Google Sheets:', {
      count: sheetsAppointments.length,
      appointments: sheetsAppointments,
    });
    
    // Cache to local storage if we got data
    if (sheetsAppointments.length > 0) {
      console.log('[AppointmentRepository.getAllAppointments] Caching appointments to local storage...');
      await readCollection(APPOINTMENTS_KEY, isAppointment).then(() => {
        // We're just warming up the cache, mutation happens in createAppointment etc.
      });
    }
    
    return sheetsAppointments;
  } catch (error) {
    console.warn('[AppointmentRepository.getAllAppointments] Google Sheets fetch failed, falling back to local storage:', error);
    // Fallback to local storage
    return readCollection(APPOINTMENTS_KEY, isAppointment);
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
