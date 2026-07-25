import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appointment, AppointmentInput, Patient, PatientInput } from '@/models/types';
import * as AppointmentRepository from '@/repository/AppointmentRepository';
import * as PatientRepository from '@/repository/PatientRepository';
import { compareAppointments, getTodayString, getTomorrowString } from '@/utils/dateUtils';

interface DataContextValue {
  patients: Patient[];
  appointments: Appointment[];
  loading: boolean;
  error: Error | null;
  addPatient: (data: PatientInput) => Promise<Patient>;
  editPatient: (id: string, data: PatientInput) => Promise<Patient>;
  removePatient: (id: string) => Promise<void>;
  addAppointment: (data: AppointmentInput) => Promise<Appointment>;
  editAppointment: (id: string, data: AppointmentInput) => Promise<Appointment>;
  removeAppointment: (id: string) => Promise<void>;
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

function sortAppointments(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort(compareAppointments);
}

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPatients, nextAppointments] = await Promise.all([
        PatientRepository.getAllPatients(),
        AppointmentRepository.getAllAppointments(),
      ]);
      setPatients(nextPatients);
      setAppointments(sortAppointments(nextAppointments));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError : new Error('Unable to load clinic data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPatient = useCallback(async (data: PatientInput) => {
    const patient = await PatientRepository.createPatient(data);
    setPatients((current) => [...current, patient]);
    return patient;
  }, []);

  const editPatient = useCallback(async (id: string, data: PatientInput) => {
    const patient = await PatientRepository.updatePatient(id, data);
    setPatients((current) => current.map((item) => (item.id === id ? patient : item)));
    return patient;
  }, []);

  const removePatient = useCallback(async (id: string) => {
    await PatientRepository.deletePatient(id);
    await AppointmentRepository.deleteAppointmentsByPatient(id);
    setPatients((current) => current.filter((patient) => patient.id !== id));
    setAppointments((current) => current.filter((appointment) => appointment.patientId !== id));
  }, []);

  const addAppointment = useCallback(async (data: AppointmentInput) => {
    const appointment = await AppointmentRepository.createAppointment(data);
    setAppointments((current) => sortAppointments([...current, appointment]));
    return appointment;
  }, []);

  const editAppointment = useCallback(async (id: string, data: AppointmentInput) => {
    const appointment = await AppointmentRepository.updateAppointment(id, data);
    setAppointments((current) =>
      sortAppointments(current.map((item) => (item.id === id ? appointment : item))),
    );
    return appointment;
  }, []);

  const removeAppointment = useCallback(async (id: string) => {
    await AppointmentRepository.deleteAppointment(id);
    setAppointments((current) => current.filter((appointment) => appointment.id !== id));
  }, []);

  const patientById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );

  const value = useMemo<DataContextValue>(() => {
    const getPatientById = (id: string) => patientById.get(id);
    const getAppointmentsByPatient = (patientId: string) =>
      appointments.filter((appointment) => appointment.patientId === patientId);
    const getAppointmentsByDate = (date: string) =>
      appointments.filter((appointment) => appointment.date === date);
    const searchPatients = (query: string) => {
      const normalizedQuery = normalizeQuery(query);
      if (!normalizedQuery) return [];
      return patients.filter((patient) =>
        [patient.firstName, patient.lastName, patient.childName, patient.phone].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery),
        ),
      );
    };
    const searchAppointments = (query: string) => {
      const normalizedQuery = normalizeQuery(query);
      if (!normalizedQuery) return [];
      return appointments.filter((appointment) => {
        const patient = patientById.get(appointment.patientId);
        return [
          patient?.firstName,
          patient?.lastName,
          patient?.childName,
          patient?.phone,
          appointment.notes,
          appointment.date,
        ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      });
    };

    return {
      patients,
      appointments,
      loading,
      error,
      addPatient,
      editPatient,
      removePatient,
      addAppointment,
      editAppointment,
      removeAppointment,
      getPatientById,
      getAppointmentsByPatient,
      getTodayAppointments: () => getAppointmentsByDate(getTodayString()),
      getTomorrowAppointments: () => getAppointmentsByDate(getTomorrowString()),
      getAppointmentsByDate,
      searchPatients,
      searchAppointments,
      reload: load,
    };
  }, [
    addAppointment,
    addPatient,
    appointments,
    editAppointment,
    editPatient,
    error,
    load,
    loading,
    patientById,
    patients,
    removeAppointment,
    removePatient,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider.');
  return context;
}
