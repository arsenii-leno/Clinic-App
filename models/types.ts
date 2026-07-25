export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  childName: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;

export function isPatient(value: unknown): value is Patient {
  if (!isRecord(value)) return false;
  return [
    value.id,
    value.firstName,
    value.lastName,
    value.childName,
    value.phone,
    value.notes,
    value.createdAt,
    value.updatedAt,
  ].every((field) => typeof field === 'string');
}

export function isAppointment(value: unknown): value is Appointment {
  if (!isRecord(value)) return false;
  return (
    [
      value.id,
      value.patientId,
      value.date,
      value.time,
      value.notes,
      value.createdAt,
      value.updatedAt,
    ].every((field) => typeof field === 'string') &&
    typeof value.status === 'string' &&
    APPOINTMENT_STATUSES.includes(value.status as AppointmentStatus)
  );
}

export function assertPatientInput(input: PatientInput): void {
  if (!input.firstName.trim() || !input.lastName.trim() || !input.phone.trim()) {
    throw new Error('A patient requires a first name, last name, and phone number.');
  }
}

export function assertAppointmentInput(input: AppointmentInput): void {
  if (
    !input.patientId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(input.time)
  ) {
    throw new Error('An appointment requires a patient, date, and time.');
  }
  if (!APPOINTMENT_STATUSES.includes(input.status)) {
    throw new Error('The appointment status is invalid.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
