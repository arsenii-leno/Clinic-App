import {
  Appointment,
  AppointmentInput,
  assertAppointmentInput,
  isAppointment,
} from '@/models/types';
import { generateId } from '@/utils/idUtils';
import { mutateCollection, readCollection } from './storage';

const APPOINTMENTS_KEY = '@clinic:appointments:v2';

export function getAllAppointments(): Promise<Appointment[]> {
  return readCollection(APPOINTMENTS_KEY, isAppointment);
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
