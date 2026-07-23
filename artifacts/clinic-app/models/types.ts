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

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
