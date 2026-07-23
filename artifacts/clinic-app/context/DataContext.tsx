import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Patient, Appointment, AppointmentStatus } from '@/models/types';
import * as PatientRepo from '@/repository/PatientRepository';
import * as AppointmentRepo from '@/repository/AppointmentRepository';
import { getTodayString, getTomorrowString, compareAppointments } from '@/utils/dateUtils';

interface DataContextValue {
  patients: Patient[];
  appointments: Appointment[];
  loading: boolean;
  // Patient CRUD
  addPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Patient>;
  editPatient: (id: string, data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  // Appointment CRUD
  addAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment>;
  editAppointment: (id: string, data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  // Queries
  getPatientById: (id: string) => Patient | undefined;
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  getTodayAppointments: () => Appointment[];
  getTomorrowAppointments: () => Appointment[];
  getAppointmentsByDate: (date: string) => Appointment[];
  searchPatients: (query: string) => Patient[];
  searchAppointments: (query: string) => Appointment[];
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await PatientRepo.seedIfNeeded();
      await AppointmentRepo.seedAppointmentsIfNeeded();
      const [pats, appts] = await Promise.all([
        PatientRepo.getAllPatients(),
        AppointmentRepo.getAllAppointments(),
      ]);
      setPatients(pats);
      setAppointments([...appts].sort(compareAppointments));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPatient = useCallback(
    async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
      const patient = await PatientRepo.createPatient(data);
      setPatients((prev) => [...prev, patient]);
      return patient;
    },
    [],
  );

  const editPatient = useCallback(
    async (id: string, data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
      const updated = await PatientRepo.updatePatient(id, data);
      if (updated) {
        setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    },
    [],
  );

  const removePatient = useCallback(async (id: string) => {
    await PatientRepo.deletePatient(id);
    // Also remove associated appointments
    const appts = await AppointmentRepo.getAllAppointments();
    const remaining = appts.filter((a) => a.patientId !== id);
    await AppointmentRepo.saveAllAppointments(remaining);
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setAppointments(remaining.sort(compareAppointments));
  }, []);

  const addAppointment = useCallback(
    async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const appt = await AppointmentRepo.createAppointment(data);
      setAppointments((prev) => [...prev, appt].sort(compareAppointments));
      return appt;
    },
    [],
  );

  const editAppointment = useCallback(
    async (id: string, data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const updated = await AppointmentRepo.updateAppointment(id, data);
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? updated : a)).sort(compareAppointments),
        );
      }
    },
    [],
  );

  const removeAppointment = useCallback(async (id: string) => {
    await AppointmentRepo.deleteAppointment(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getPatientById = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  );

  const getAppointmentsByPatient = useCallback(
    (patientId: string) => appointments.filter((a) => a.patientId === patientId),
    [appointments],
  );

  const getTodayAppointments = useCallback(
    () => appointments.filter((a) => a.date === getTodayString()),
    [appointments],
  );

  const getTomorrowAppointments = useCallback(
    () => appointments.filter((a) => a.date === getTomorrowString()),
    [appointments],
  );

  const getAppointmentsByDate = useCallback(
    (date: string) => appointments.filter((a) => a.date === date),
    [appointments],
  );

  const searchPatients = useCallback(
    (query: string): Patient[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase().trim();
      return patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.childName.toLowerCase().includes(q) ||
          p.phone.includes(q),
      );
    },
    [patients],
  );

  const searchAppointments = useCallback(
    (query: string): Appointment[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase().trim();
      return appointments.filter((a) => {
        const patient = patients.find((p) => p.id === a.patientId);
        if (!patient) return false;
        return (
          patient.firstName.toLowerCase().includes(q) ||
          patient.lastName.toLowerCase().includes(q) ||
          patient.childName.toLowerCase().includes(q) ||
          patient.phone.includes(q) ||
          a.notes.toLowerCase().includes(q) ||
          a.date.includes(q)
        );
      });
    },
    [appointments, patients],
  );

  return (
    <DataContext.Provider
      value={{
        patients,
        appointments,
        loading,
        addPatient,
        editPatient,
        removePatient,
        addAppointment,
        editAppointment,
        removeAppointment,
        getPatientById,
        getAppointmentsByPatient,
        getTodayAppointments,
        getTomorrowAppointments,
        getAppointmentsByDate,
        searchPatients,
        searchAppointments,
        reload: load,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
