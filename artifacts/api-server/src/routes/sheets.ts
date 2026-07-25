import { Router, type Request, type Response } from 'express';
import {
  createAppointment,
  createPatient,
  deleteAppointment,
  deletePatient,
  getAllAppointments,
  getAllPatients,
  initSheets,
  testConnection,
  updateAppointment,
  updatePatient,
} from '../lib/sheetsService';

const router = Router();

function getCredentials(req: Request) {
  const { spreadsheetId, serviceAccountJson } = req.body ?? {};
  return { spreadsheetId, serviceAccountJson };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getParamId(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  return Array.isArray(value) ? value[0] ?? '' : '';
}

function toPatientModel(row: any) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    childName: row.childName,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAppointmentModel(row: any) {
  return {
    id: row.id,
    patientId: row.patientId,
    date: row.date,
    time: row.time,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.post('/sheets/test-connection', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  const result = await testConnection(spreadsheetId, serviceAccountJson);
  return res.json(result);
});

router.post('/sheets/init', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  await initSheets(spreadsheetId, serviceAccountJson);
  return res.json({ ok: true });
});

router.post('/sheets/sync', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  const [patients, appointments] = await Promise.all([
    getAllPatients(spreadsheetId, serviceAccountJson),
    getAllAppointments(spreadsheetId, serviceAccountJson),
  ]);

  return res.json({
    patients: patients.map(toPatientModel),
    appointments: appointments.map(toAppointmentModel),
  });
});

router.post('/sheets/data', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  const [patients, appointments] = await Promise.all([
    getAllPatients(spreadsheetId, serviceAccountJson),
    getAllAppointments(spreadsheetId, serviceAccountJson),
  ]);

  return res.json({
    patients: patients.map(toPatientModel),
    appointments: appointments.map(toAppointmentModel),
  });
});

router.post('/sheets/patients', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson, patient } = req.body ?? {};
  if (!spreadsheetId || !serviceAccountJson || !patient) {
    return res.status(400).json({ ok: false, error: 'Missing patient payload.' });
  }

  const now = new Date().toISOString();
  const row = {
    id: patient.id ?? makeId('p'),
    firstName: patient.firstName ?? '',
    lastName: patient.lastName ?? '',
    childName: patient.childName ?? '',
    phone: patient.phone ?? '',
    notes: patient.notes ?? '',
    createdAt: patient.createdAt ?? now,
    updatedAt: patient.updatedAt ?? now,
  };

  await createPatient(spreadsheetId, serviceAccountJson, row);
  return res.json(toPatientModel(row));
});

router.put('/sheets/patients/:id', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson, patient } = req.body ?? {};
  if (!spreadsheetId || !serviceAccountJson || !patient) {
    return res.status(400).json({ ok: false, error: 'Missing patient payload.' });
  }

  const existing = await getAllPatients(spreadsheetId, serviceAccountJson);
  const patientId = getParamId(req.params.id);
  const current = existing.find((item: any) => item.id === patientId);
  const now = new Date().toISOString();
  const row = {
    id: patientId,
    firstName: patient.firstName ?? current?.firstName ?? '',
    lastName: patient.lastName ?? current?.lastName ?? '',
    childName: patient.childName ?? current?.childName ?? '',
    phone: patient.phone ?? current?.phone ?? '',
    notes: patient.notes ?? current?.notes ?? '',
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const updated = await updatePatient(spreadsheetId, serviceAccountJson, row);
  if (!updated) {
    return res.status(404).json({ ok: false, error: 'Patient not found.' });
  }
  return res.json(toPatientModel(row));
});

router.delete('/sheets/patients/:id', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  const deleted = await deletePatient(spreadsheetId, serviceAccountJson, getParamId(req.params.id));
  return res.json({ ok: deleted });
});

router.post('/sheets/appointments', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson, appointment } = req.body ?? {};
  if (!spreadsheetId || !serviceAccountJson || !appointment) {
    return res.status(400).json({ ok: false, error: 'Missing appointment payload.' });
  }

  const now = new Date().toISOString();
  const row = {
    id: appointment.id ?? makeId('a'),
    patientId: appointment.patientId ?? '',
    date: appointment.date ?? '',
    time: appointment.time ?? '',
    status: appointment.status ?? 'scheduled',
    notes: appointment.notes ?? '',
    createdAt: appointment.createdAt ?? now,
    updatedAt: appointment.updatedAt ?? now,
  };

  await createAppointment(spreadsheetId, serviceAccountJson, row);
  return res.json(toAppointmentModel(row));
});

router.put('/sheets/appointments/:id', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson, appointment } = req.body ?? {};
  if (!spreadsheetId || !serviceAccountJson || !appointment) {
    return res.status(400).json({ ok: false, error: 'Missing appointment payload.' });
  }

  const existing = await getAllAppointments(spreadsheetId, serviceAccountJson);
  const appointmentId = getParamId(req.params.id);
  const current = existing.find((item: any) => item.id === appointmentId);
  const now = new Date().toISOString();
  const row = {
    id: appointmentId,
    patientId: appointment.patientId ?? current?.patientId ?? '',
    date: appointment.date ?? current?.date ?? '',
    time: appointment.time ?? current?.time ?? '',
    status: appointment.status ?? current?.status ?? 'scheduled',
    notes: appointment.notes ?? current?.notes ?? '',
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const updated = await updateAppointment(spreadsheetId, serviceAccountJson, row);
  if (!updated) {
    return res.status(404).json({ ok: false, error: 'Appointment not found.' });
  }
  return res.json(toAppointmentModel(row));
});

router.delete('/sheets/appointments/:id', async (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountJson } = getCredentials(req);
  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(400).json({ ok: false, error: 'Spreadsheet ID and service account JSON are required.' });
  }

  const deleted = await deleteAppointment(spreadsheetId, serviceAccountJson, getParamId(req.params.id));
  return res.json({ ok: deleted });
});

export default router;
