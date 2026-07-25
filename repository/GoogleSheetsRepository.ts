import { Patient, Appointment } from '../models/types';

const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzRUHdUYf4zm8-nJN9-MPsZ2Ws4O8dbDvZnU-286y74rlVE-Hi1RPMfDthpYpLxgH2iRA/exec';

export class GoogleSheetsRepository {
  private webAppUrl: string;

  constructor(webAppUrl: string = DEFAULT_WEB_APP_URL) {
    this.webAppUrl = webAppUrl;
  }

  private async request(action: string, data?: any) {
    if (!this.webAppUrl) {
      throw new Error('Google Apps Script URL is not configured.');
    }

    const requestPayload = { action, data };
    console.log(`[GoogleSheetsRepository] Sending request:`, {
      url: this.webAppUrl,
      payload: requestPayload,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log(`[GoogleSheetsRepository] Response status for ${action}:`, response.status, response.ok);

      const json = await response.json();
      console.log(`[GoogleSheetsRepository] Raw JSON response for ${action}:`, json);

      if (json.status !== 'success') {
        console.error(`[GoogleSheetsRepository] Error response from Google Apps Script:`, {
          action,
          status: json.status,
          message: json.message,
          fullResponse: json,
        });
        throw new Error(json.message || 'Error from Google Apps Script');
      }

      console.log(`[GoogleSheetsRepository] Success response for ${action}:`, json);
      return json;
    } catch (error) {
      console.error(`[GoogleSheetsRepository] Error executing ${action}:`, {
        action,
        error: error instanceof Error ? error.message : String(error),
        fullError: error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async getPatients(): Promise<Patient[]> {
    console.log('[GoogleSheetsRepository.getPatients] Starting fetch...');
    const res = await this.request('getAllData');
    console.log('[GoogleSheetsRepository.getPatients] Response received:', {
      hasPatients: !!res.patients,
      patientCount: res.patients?.length || 0,
      patients: res.patients,
    });
    const patients = res.patients || [];
    console.log('[GoogleSheetsRepository.getPatients] Returning patients:', patients);
    return patients;
  }

  async savePatient(patient: Patient): Promise<void> {
    await this.request('savePatient', patient);
  }

  async deletePatient(id: string): Promise<void> {
    await this.request('deletePatient', { id });
  }

  async getAppointments(): Promise<Appointment[]> {
    console.log('[GoogleSheetsRepository.getAppointments] Starting fetch...');
    const res = await this.request('getAllData');
    console.log('[GoogleSheetsRepository.getAppointments] Response received:', {
      hasAppointments: !!res.appointments,
      appointmentCount: res.appointments?.length || 0,
      appointments: res.appointments,
    });
    const appointments = res.appointments || [];
    console.log('[GoogleSheetsRepository.getAppointments] Returning appointments:', appointments);
    return appointments;
  }

  async saveAppointment(appointment: Appointment): Promise<void> {
    await this.request('saveAppointment', appointment);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.request('deleteAppointment', { id });
  }
}