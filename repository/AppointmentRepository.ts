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
const sheetsRepository = new GoogleSheetsRepository();

export async function getAllAppointments(): Promise<Appointment[]> {
  console.log('[AppointmentRepository.getAllAppointments] Fetching from local storage...');
  return readCollection(APPOINTMENTS_KEY, isAppointment);
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  assertAppointmentInput(input);

  const newAppointment = await mutateCollection(
      APPOINTMENTS_KEY,
      isAppointment,
      (appointments) => {
        const now = new Date().toISOString();

        const appointment: Appointment = {
          ...input,
          id: generateId('appointment'),
          createdAt: now,
          updatedAt: now,
        };

        return { items: [...appointments, appointment], result: appointment };
      },
  );

  sheetsRepository.saveAppointment(newAppointment).catch((error) => {
    console.error('[Sync] Failed to sync new appointment to Google Sheets:', error);
  });

  return newAppointment;
}

export async function updateAppointment(
    id: string,
    input: AppointmentInput,
): Promise<Appointment> {
  assertAppointmentInput(input);

  const updatedAppointment = await mutateCollection(
      APPOINTMENTS_KEY,
      isAppointment,
      (appointments) => {
        const index = appointments.findIndex(
            (appointment) => appointment.id === id,
        );

        if (index < 0) {
          throw new Error('Appointment not found.');
        }

        const appointment = {
          ...appointments[index],
          ...input,
          updatedAt: new Date().toISOString(),
        };

        const next = [...appointments];
        next[index] = appointment;

        return { items: next, result: appointment };
      },
  );

  sheetsRepository.saveAppointment(updatedAppointment).catch((error) => {
    console.error('[Sync] Failed to update appointment in Google Sheets:', error);
  });

  return updatedAppointment;
}

export async function deleteAppointment(id: string): Promise<void> {
  await mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => ({
    items: appointments.filter((appointment) => appointment.id !== id),
    result: undefined,
  }));

  sheetsRepository.deleteAppointment(id).catch((error) => {
    console.error('[Sync] Failed to delete appointment from Google Sheets:', error);
  });
}

export async function deleteAppointmentsByPatient(patientId: string): Promise<void> {
  const allAppointments = await readCollection(APPOINTMENTS_KEY, isAppointment);

  const toDelete = allAppointments.filter(
      (appointment) => appointment.patientId === patientId,
  );

  await mutateCollection(APPOINTMENTS_KEY, isAppointment, (appointments) => ({
    items: appointments.filter(
        (appointment) => appointment.patientId !== patientId,
    ),
    result: undefined,
  }));

  toDelete.forEach((appointment) => {
    sheetsRepository.deleteAppointment(appointment.id).catch((error) => {
      console.error(
          '[Sync] Failed to delete appointment from Google Sheets:',
          error,
      );
    });
  });
}