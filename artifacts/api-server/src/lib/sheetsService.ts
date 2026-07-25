import { google } from "googleapis";

// ── Types (mirror the mobile app models) ─────────────────────────────────────

export interface PatientRow {
  id: string;
  firstName: string;
  lastName: string;
  childName: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRow {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const PATIENT_SHEET = "Patients";
const APPT_SHEET = "Appointments";
const PATIENT_HEADERS = ["id","firstName","lastName","childName","phone","notes","createdAt","updatedAt"];
const APPT_HEADERS    = ["id","patientId","date","time","status","notes","createdAt","updatedAt"];

// ── Auth helper ───────────────────────────────────────────────────────────────

function buildClient(serviceAccountJson: string) {
  const creds =
    typeof serviceAccountJson === "string"
      ? JSON.parse(serviceAccountJson)
      : serviceAccountJson;
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// ── Row converters ────────────────────────────────────────────────────────────

function rowToPatient(row: string[]): PatientRow {
  return {
    id:        row[0] ?? "",
    firstName: row[1] ?? "",
    lastName:  row[2] ?? "",
    childName: row[3] ?? "",
    phone:     row[4] ?? "",
    notes:     row[5] ?? "",
    createdAt: row[6] ?? "",
    updatedAt: row[7] ?? "",
  };
}
function patientToRow(p: PatientRow): string[] {
  return [p.id, p.firstName, p.lastName, p.childName, p.phone, p.notes, p.createdAt, p.updatedAt];
}
function rowToAppt(row: string[]): AppointmentRow {
  return {
    id:        row[0] ?? "",
    patientId: row[1] ?? "",
    date:      row[2] ?? "",
    time:      row[3] ?? "",
    status:    row[4] ?? "",
    notes:     row[5] ?? "",
    createdAt: row[6] ?? "",
    updatedAt: row[7] ?? "",
  };
}
function apptToRow(a: AppointmentRow): string[] {
  return [a.id, a.patientId, a.date, a.time, a.status, a.notes, a.createdAt, a.updatedAt];
}

// ── Test connection ───────────────────────────────────────────────────────────

export async function testConnection(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<{ ok: boolean; title?: string; email?: string; error?: string }> {
  try {
    const sheets = buildClient(serviceAccountJson);
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const creds = JSON.parse(serviceAccountJson);
    return {
      ok: true,
      title: res.data.properties?.title ?? "",
      email: creds.client_email ?? "",
    };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

// ── Init sheets (create tabs + headers if missing) ────────────────────────────

export async function initSheets(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<void> {
  const sheets = buildClient(serviceAccountJson);
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? "");

  const addRequests: any[] = [];
  if (!existing.includes(PATIENT_SHEET))
    addRequests.push({ addSheet: { properties: { title: PATIENT_SHEET } } });
  if (!existing.includes(APPT_SHEET))
    addRequests.push({ addSheet: { properties: { title: APPT_SHEET } } });

  if (addRequests.length)
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: addRequests } });

  // Write headers if empty
  for (const [sheetName, headers] of [
    [PATIENT_SHEET, PATIENT_HEADERS],
    [APPT_SHEET, APPT_HEADERS],
  ] as [string, string[]][]) {
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:H1`,
    });
    if (!check.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }
}

// ── Helper: find 0-based data-row index for a given ID ───────────────────────

async function findRowIndex(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
  id: string,
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values ?? [];
  // rows[0] = header row → skip; return 0-based row index in the sheet (header = 0)
  return rows.findIndex((r, i) => i > 0 && r[0] === id);
}

async function getSheetId(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
): Promise<number | null> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === sheetName,
  );
  return sheet?.properties?.sheetId ?? null;
}

// ── Patients CRUD ─────────────────────────────────────────────────────────────

export async function getAllPatients(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<PatientRow[]> {
  const sheets = buildClient(serviceAccountJson);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${PATIENT_SHEET}!A:H`,
  });
  const rows = (res.data.values ?? []) as string[][];
  return rows.slice(1).map(rowToPatient).filter((p) => p.id);
}

export async function createPatient(
  spreadsheetId: string,
  serviceAccountJson: string,
  patient: PatientRow,
): Promise<void> {
  const sheets = buildClient(serviceAccountJson);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${PATIENT_SHEET}!A:H`,
    valueInputOption: "RAW",
    requestBody: { values: [patientToRow(patient)] },
  });
}

export async function updatePatient(
  spreadsheetId: string,
  serviceAccountJson: string,
  patient: PatientRow,
): Promise<boolean> {
  const sheets = buildClient(serviceAccountJson);
  const rowIdx = await findRowIndex(sheets, spreadsheetId, PATIENT_SHEET, patient.id);
  if (rowIdx === -1) return false;
  const sheetRow = rowIdx + 1; // 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${PATIENT_SHEET}!A${sheetRow}:H${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [patientToRow(patient)] },
  });
  return true;
}

export async function deletePatient(
  spreadsheetId: string,
  serviceAccountJson: string,
  id: string,
): Promise<boolean> {
  const sheets = buildClient(serviceAccountJson);
  const rowIdx = await findRowIndex(sheets, spreadsheetId, PATIENT_SHEET, id);
  if (rowIdx === -1) return false;
  const sheetId = await getSheetId(sheets, spreadsheetId, PATIENT_SHEET);
  if (sheetId === null) return false;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIdx, endIndex: rowIdx + 1 },
        },
      }],
    },
  });
  return true;
}

// ── Appointments CRUD ─────────────────────────────────────────────────────────

export async function getAllAppointments(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<AppointmentRow[]> {
  const sheets = buildClient(serviceAccountJson);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${APPT_SHEET}!A:H`,
  });
  const rows = (res.data.values ?? []) as string[][];
  return rows.slice(1).map(rowToAppt).filter((a) => a.id);
}

export async function createAppointment(
  spreadsheetId: string,
  serviceAccountJson: string,
  appt: AppointmentRow,
): Promise<void> {
  const sheets = buildClient(serviceAccountJson);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${APPT_SHEET}!A:H`,
    valueInputOption: "RAW",
    requestBody: { values: [apptToRow(appt)] },
  });
}

export async function updateAppointment(
  spreadsheetId: string,
  serviceAccountJson: string,
  appt: AppointmentRow,
): Promise<boolean> {
  const sheets = buildClient(serviceAccountJson);
  const rowIdx = await findRowIndex(sheets, spreadsheetId, APPT_SHEET, appt.id);
  if (rowIdx === -1) return false;
  const sheetRow = rowIdx + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${APPT_SHEET}!A${sheetRow}:H${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [apptToRow(appt)] },
  });
  return true;
}

export async function deleteAppointment(
  spreadsheetId: string,
  serviceAccountJson: string,
  id: string,
): Promise<boolean> {
  const sheets = buildClient(serviceAccountJson);
  const rowIdx = await findRowIndex(sheets, spreadsheetId, APPT_SHEET, id);
  if (rowIdx === -1) return false;
  const sheetId = await getSheetId(sheets, spreadsheetId, APPT_SHEET);
  if (sheetId === null) return false;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIdx, endIndex: rowIdx + 1 },
        },
      }],
    },
  });
  return true;
}

// ── Counts ────────────────────────────────────────────────────────────────────

export async function getCounts(
  spreadsheetId: string,
  serviceAccountJson: string,
): Promise<{ patients: number; appointments: number }> {
  const [p, a] = await Promise.all([
    getAllPatients(spreadsheetId, serviceAccountJson),
    getAllAppointments(spreadsheetId, serviceAccountJson),
  ]);
  return { patients: p.length, appointments: a.length };
}
